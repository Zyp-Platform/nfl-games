import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '@zyp/fastify-plugins';
import type { ESPNStanding } from '../../infrastructure/providers/espn/espn-api-types.js';

/**
 * Query parameter schema for standings endpoint
 */
const standingsQuerySchema = z.object({
  season: z.string().regex(/^\d{4}$/).optional(),
});

/**
 * Standings routes
 */
export async function standingsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/standings
   * Get NFL standings by season
   */
  fastify.get(
    '/standings',
    {
      schema: {
        tags: ['standings'],
        summary: 'Get NFL standings',
        description: 'Retrieve current NFL standings with division and conference breakdowns',
        querystring: {
          type: 'object',
          properties: {
            season: {
              type: 'string',
              pattern: '^\\d{4}$',
              description: 'Season year (e.g., 2024)',
            },
          },
        },
        response: {
          200: {
            description: 'Successful response with standings',
            type: 'object',
            additionalProperties: true,
          },
          400: {
            description: 'Invalid parameters',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (request, reply) => {
      const validation = standingsQuerySchema.safeParse(request.query);
      if (!validation.success) {
        throw new ValidationError('Invalid query parameters', validation.error);
      }
      const { season } = validation.data;
      const seasonYear = season ? parseInt(season, 10) : new Date().getFullYear();

      // Fetch from ESPN API
      const response = await fetch(
        `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${seasonYear}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

        interface Conference {
          id: string;
          name: string;
          abbreviation: string;
          standings: {
            entries: ESPNStanding[];
          };
        }

        interface StandingsResponse {
          children: Conference[];
        }

        const data = (await response.json()) as StandingsResponse;

        // Division mapping
        const divisionMap: Record<string, string> = {
          // AFC East
          '2': 'East',
          '15': 'East',
          '20': 'East',
          '21': 'East',
          // AFC North
          '33': 'North',
          '4': 'North',
          '5': 'North',
          '23': 'North',
          // AFC South
          '34': 'South',
          '11': 'South',
          '30': 'South',
          '10': 'South',
          // AFC West
          '7': 'West',
          '12': 'West',
          '13': 'West',
          '24': 'West',
          // NFC East
          '6': 'East',
          '19': 'East',
          '28': 'East',
          '17': 'East',
          // NFC North
          '3': 'North',
          '8': 'North',
          '9': 'North',
          '16': 'North',
          // NFC South
          '1': 'South',
          '29': 'South',
          '18': 'South',
          '27': 'South',
          // NFC West
          '22': 'West',
          '14': 'West',
          '25': 'West',
          '26': 'West',
        };

        // Transform ESPN data to our format
        interface TeamWithDivision {
          division: string;
          team: {
            id: string;
            abbreviation: string;
            displayName: string;
            logo?: string;
          };
          stats: {
            wins: string;
            losses: string;
            winPercent: string;
            streak: string;
            pointDifferential: string;
          };
        }

        const conferences = data.children.map((conf: Conference) => {
          const teams: TeamWithDivision[] = conf.standings.entries.map((entry: ESPNStanding) => {
            const wins = entry.stats?.find((s) => s.name === 'wins')?.displayValue || '0';
            const losses = entry.stats?.find((s) => s.name === 'losses')?.displayValue || '0';
            const winPct =
              entry.stats?.find((s) => s.name === 'winPercent')?.displayValue || '.000';
            const streak = entry.stats?.find((s) => s.name === 'streak')?.displayValue || '-';
            const pointDiff =
              entry.stats?.find((s) => s.name === 'differential')?.displayValue || '0';

            return {
              division: divisionMap[entry.team.id] || 'Unknown',
              team: {
                id: entry.team.id,
                abbreviation: entry.team.abbreviation,
                displayName: entry.team.displayName,
                logo: entry.team.logos?.[0]?.href,
              },
              stats: {
                wins,
                losses,
                winPercent: winPct,
                streak,
                pointDifferential: pointDiff,
              },
            };
          });

          // Group by division
          const divisions = teams.reduce(
            (
              divs: Record<
                string,
                Array<{ team: TeamWithDivision['team']; stats: TeamWithDivision['stats'] }>
              >,
              team
            ) => {
              if (!divs[team.division]) {
                divs[team.division] = [];
              }
              divs[team.division].push({
                team: team.team,
                stats: team.stats,
              });
              return divs;
            },
            {}
          );

          return {
            id: conf.id,
            name: conf.name,
            abbreviation: conf.abbreviation,
            divisions,
          };
        });

        return reply.success({
          season: seasonYear,
          conferences,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
    }
  );
}
