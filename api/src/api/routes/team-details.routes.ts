import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@zyp/fastify-plugins';
import type { ESPNLogo, ESPNRecord } from '../../infrastructure/providers/espn/espn-api-types.js';

/**
 * Route parameter schema for team ID
 */
const teamIdParamSchema = z.object({
  teamId: z.string().min(1),
});

/**
 * Team Details routes
 */
export async function teamDetailsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/teams/:teamId
   * Get detailed team information including roster and stats
   */
  fastify.get<{ Params: { teamId: string } }>(
    '/teams/:teamId',
    {
      schema: {
        tags: ['teams'],
        summary: 'Get team details',
        description: 'Retrieve detailed team information including roster, record, and stats',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', description: 'Team ID' },
          },
          required: ['teamId'],
        },
        response: {
          200: {
            description: 'Successful response with team details',
            type: 'object',
            additionalProperties: true,
          },
          400: {
            description: 'Invalid parameters',
            type: 'object',
            additionalProperties: true,
          },
          404: {
            description: 'Team not found',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (request, reply) => {
      const validation = teamIdParamSchema.safeParse(request.params);
      if (!validation.success) {
        throw new ValidationError('Invalid route parameters', validation.error);
      }
      const { teamId } = validation.data;

      // Fetch from ESPN API
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError(`No team found with ID ${teamId}`);
        }
        throw new Error(`ESPN API error: ${response.status}`);
      }

        interface TeamResponse {
          team: {
            id: string;
            abbreviation: string;
            displayName: string;
            shortDisplayName: string;
            location: string;
            name: string;
            nickname: string;
            color: string;
            alternateColor: string;
            logos?: ESPNLogo[];
            record?: {
              items?: ESPNRecord[];
            };
            nextEvent?: Array<{
              id: string;
              date: string;
              name: string;
              shortName?: string;
            }>;
          };
        }

        const data = (await response.json()) as TeamResponse;
        const team = data.team;

        // Extract team info
        const teamInfo = {
          id: team.id,
          abbreviation: team.abbreviation,
          displayName: team.displayName,
          shortDisplayName: team.shortDisplayName,
          location: team.location,
          name: team.name,
          nickname: team.nickname,
          color: team.color,
          alternateColor: team.alternateColor,
          logo: team.logos?.[0]?.href,
          logos: team.logos?.map((logo: ESPNLogo) => ({
            href: logo.href,
            width: logo.width,
            height: logo.height,
            rel: logo.rel,
          })),
        };

        // Extract record
        const recordItems: ESPNRecord[] = team.record?.items || [];
        const totalRecord = recordItems.find((r) => r.type === 'total');
        const homeRecord = recordItems.find((r) => r.type === 'home');
        const awayRecord = recordItems.find((r) => r.type === 'road');

        const getStatValue = (
          stats: Array<{ name: string; value: number }> | undefined,
          name: string
        ) => stats?.find((s) => s.name === name)?.value;

        const record = totalRecord
          ? {
              summary: totalRecord.summary,
              wins: getStatValue(totalRecord.stats, 'wins'),
              losses: getStatValue(totalRecord.stats, 'losses'),
              ties: getStatValue(totalRecord.stats, 'ties'),
              winPercent: getStatValue(totalRecord.stats, 'winPercent'),
              pointsFor: getStatValue(totalRecord.stats, 'pointsFor'),
              pointsAgainst: getStatValue(totalRecord.stats, 'pointsAgainst'),
              pointDifferential: getStatValue(totalRecord.stats, 'pointDifferential'),
              streak: getStatValue(totalRecord.stats, 'streak'),
              playoffSeed: getStatValue(totalRecord.stats, 'playoffSeed'),
              divisionWins: getStatValue(totalRecord.stats, 'divisionWins'),
              divisionLosses: getStatValue(totalRecord.stats, 'divisionLosses'),
              home: homeRecord
                ? {
                    summary: homeRecord.summary,
                    wins: getStatValue(homeRecord.stats, 'wins'),
                    losses: getStatValue(homeRecord.stats, 'losses'),
                  }
                : null,
              away: awayRecord
                ? {
                    summary: awayRecord.summary,
                    wins: getStatValue(awayRecord.stats, 'wins'),
                    losses: getStatValue(awayRecord.stats, 'losses'),
                  }
                : null,
            }
          : null;

        // Extract next event (if available)
        const nextEvent = team.nextEvent?.[0]
          ? {
              id: team.nextEvent[0].id,
              date: team.nextEvent[0].date,
              name: team.nextEvent[0].name,
              shortName: team.nextEvent[0].shortName,
            }
          : null;

        // Fetch roster
        const rosterResponse = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`,
          {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(10000),
          }
        );

        let roster = null;
        if (rosterResponse.ok) {
          // Group athletes by position
          interface RosterAthlete {
            id: string;
            displayName: string;
            shortName: string;
            jersey: string;
            position?: { abbreviation: string };
            headshot?: { href: string };
            age?: number;
            displayHeight?: string;
            displayWeight?: string;
            experience?: { years: number };
            college?: { name: string };
            debutYear?: number;
            status?: { name: string };
            injuries?: Array<{
              status: string;
              date: string;
              details?: { type: string };
              longComment?: string;
              shortComment?: string;
            }>;
            birthPlace?: {
              city: string;
              state: string;
              country: string;
            };
          }

          interface PositionGroup {
            position: string;
            items?: RosterAthlete[];
          }

          interface RosterResponse {
            athletes?: PositionGroup[];
          }

          const rosterData = (await rosterResponse.json()) as RosterResponse;
          const athletes: PositionGroup[] = rosterData.athletes || [];
          roster = athletes.map((positionGroup) => ({
            position: positionGroup.position,
            items:
              positionGroup.items?.map((athlete) => ({
                id: athlete.id,
                displayName: athlete.displayName,
                shortName: athlete.shortName,
                jersey: athlete.jersey,
                position: athlete.position?.abbreviation,
                headshot: athlete.headshot?.href,
                age: athlete.age,
                height: athlete.displayHeight,
                weight: athlete.displayWeight,
                experience: athlete.experience?.years,
                college: athlete.college?.name,
                debutYear: athlete.debutYear,
                status: athlete.status?.name,
                injuries:
                  athlete.injuries?.map((injury) => ({
                    status: injury.status,
                    date: injury.date,
                    details: injury.details?.type,
                    description: injury.longComment || injury.shortComment,
                  })) || [],
                birthPlace: athlete.birthPlace
                  ? {
                      city: athlete.birthPlace.city,
                      state: athlete.birthPlace.state,
                      country: athlete.birthPlace.country,
                    }
                  : null,
              })) || [],
          }));
        }

        return reply.success({
          team: teamInfo,
          record,
          nextEvent,
          roster,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
    }
  );

  /**
   * GET /api/v1/teams/:teamId/statistics
   * Get team statistics
   */
  fastify.get<{ Params: { teamId: string } }>(
    '/teams/:teamId/statistics',
    {
      schema: {
        tags: ['teams'],
        summary: 'Get team statistics',
        description:
          'Retrieve team performance statistics including offensive and defensive metrics',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', description: 'Team ID' },
          },
          required: ['teamId'],
        },
        response: {
          200: {
            description: 'Successful response with team statistics',
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
      const validation = teamIdParamSchema.safeParse(request.params);
      if (!validation.success) {
        throw new ValidationError('Invalid route parameters', validation.error);
      }
      const { teamId } = validation.data;

      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/statistics`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

        // Transform statistics into organized categories
        interface StatCategory {
          name: string;
          displayName: string;
          stats?: Array<{
            name: string;
            displayName: string;
            description?: string;
            value?: number;
            displayValue?: string;
            rank?: number;
            rankDisplayValue?: string;
          }>;
        }

        interface StatisticsResponse {
          results?: {
            stats?: {
              categories?: StatCategory[];
            };
          };
        }

        const data = (await response.json()) as StatisticsResponse;
        const categories: StatCategory[] = data.results?.stats?.categories || [];

        const transformCategory = (category: StatCategory) => ({
          name: category.name,
          displayName: category.displayName,
          stats:
            category.stats?.map((stat) => ({
              name: stat.name,
              displayName: stat.displayName,
              description: stat.description,
              value: stat.value,
              displayValue: stat.displayValue,
              rank: stat.rank,
              rankDisplayValue: stat.rankDisplayValue,
            })) || [],
        });

        const emptyCategory: StatCategory = { name: '', displayName: '' };

        const statistics = {
          passing: transformCategory(categories.find((c) => c.name === 'passing') || emptyCategory),
          rushing: transformCategory(categories.find((c) => c.name === 'rushing') || emptyCategory),
          receiving: transformCategory(
            categories.find((c) => c.name === 'receiving') || emptyCategory
          ),
          defensive: transformCategory(
            categories.find((c) => c.name === 'defensive') || emptyCategory
          ),
          general: transformCategory(categories.find((c) => c.name === 'general') || emptyCategory),
          scoring: transformCategory(categories.find((c) => c.name === 'scoring') || emptyCategory),
        };

        return reply.success({
          statistics,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
    }
  );
}
