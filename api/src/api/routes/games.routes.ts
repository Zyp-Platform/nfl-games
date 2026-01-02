import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '@zyp/fastify-plugins';
import type { Container } from '../container.js';
import type {
  ESPNBoxScore,
  ESPNTeamLeaders,
  ESPNScoringPlay,
  ESPNDrive,
  ESPNSummaryResponse,
  ESPNStat,
  ESPNLeaderCategory,
  ESPNLeaderItem,
} from '../../infrastructure/providers/espn/espn-api-types.js';

/**
 * Game ID parameter schema
 */
const gameIdParamSchema = z.object({
  id: z.string().min(1),
});

type GameIdParam = z.infer<typeof gameIdParamSchema>;

/**
 * Games routes
 */
export async function gamesRoutes(fastify: FastifyInstance) {
  const container = (fastify as FastifyInstance & { container: Container }).container;

  /**
   * GET /api/v1/games/live
   * Get all currently live games
   */
  fastify.get(
    '/games/live',
    {
      schema: {
        tags: ['games'],
        summary: 'Get live NFL games',
        description: 'Retrieve all games currently in progress with real-time scores and status',
        response: {
          200: {
            description: 'Successful response with live games',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (_request, reply) => {
      // Execute use case
      const result = await container.getLiveGamesUseCase.execute();

      // Return response
      return reply.success({
        games: result.games.map((game) => game.toObject()),
        metadata: {
          totalLiveGames: result.games.length,
          clutchTimeGames: result.games.filter((g) => g.isClutchTime).length,
          cacheHit: result.fromCache,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/v1/games/:id
   * Get details for a specific game
   */
  fastify.get<{ Params: GameIdParam }>(
    '/games/:id',
    {
      schema: {
        tags: ['games'],
        summary: 'Get game details',
        description: 'Retrieve detailed information for a specific NFL game by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Game ID (ESPN ID)' },
          },
        },
        response: {
          200: {
            description: 'Successful response with game details',
            type: 'object',
            additionalProperties: true,
          },
          404: {
            description: 'Game not found',
            type: 'object',
            additionalProperties: true,
          },
          422: {
            description: 'Invalid game ID (validation error)',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: GameIdParam }>, reply) => {
      // Validate parameters
      const validation = gameIdParamSchema.safeParse(request.params);

      if (!validation.success) {
        throw new ValidationError('Invalid game ID', validation.error.format());
      }

      const { id } = validation.data;

      // Execute use case
      const result = await container.getGameDetailsUseCase.execute({ gameId: id });

      // Check if game was found
      if (!result.game) {
        throw new NotFoundError(`No game found with ID: ${id}`);
      }

      // Return response
      return reply.success({
        game: result.game.toObject(),
        metadata: {
          cacheHit: result.fromCache,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/v1/games/:id/summary
   * Get enhanced summary for a specific game with box score, leaders, scoring plays, and drives
   */
  fastify.get<{ Params: GameIdParam }>(
    '/games/:id/summary',
    {
      schema: {
        tags: ['games'],
        summary: 'Get game summary with detailed stats',
        description:
          'Retrieve comprehensive game summary including box score, leaders, scoring plays, and drives',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Game ID (ESPN ID)' },
          },
        },
        response: {
          200: {
            description: 'Successful response with game summary',
            type: 'object',
            additionalProperties: true,
          },
          404: {
            description: 'Game not found',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: GameIdParam }>, reply) => {
      const { id } = request.params;

      try {
        // Fetch from ESPN summary API
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${id}`,
          {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new NotFoundError(`No game summary found with ID ${id}`);
          }
          throw new Error(`ESPN API error: ${response.status}`);
        }

        const data = (await response.json()) as ESPNSummaryResponse;

        // Extract box score
        const boxscore =
          data.boxscore?.teams?.map((team: ESPNBoxScore) => ({
            team: {
              id: team.team.id,
              abbreviation: team.team.abbreviation,
              displayName: team.team.displayName,
              logo: team.team.logo,
            },
            statistics:
              team.statistics?.map((stat: ESPNStat) => ({
                name: stat.name,
                displayValue: stat.displayValue,
                label: stat.label,
              })) || [],
          })) || [];

        // Extract leaders
        const leaders =
          data.leaders?.map((teamLeaders: ESPNTeamLeaders) => ({
            team: {
              id: teamLeaders.team.id,
              abbreviation: teamLeaders.team.abbreviation,
              displayName: teamLeaders.team.displayName,
              logo: teamLeaders.team.logo,
            },
            leaders:
              teamLeaders.leaders?.map((category: ESPNLeaderCategory) => ({
                name: category.name,
                displayName: category.displayName,
                leaders:
                  category.leaders?.map((leader: ESPNLeaderItem) => ({
                    displayValue: leader.displayValue,
                    athlete: {
                      id: leader.athlete.id,
                      displayName: leader.athlete.displayName,
                      shortName: leader.athlete.shortName,
                      headshot: leader.athlete.headshot,
                      jersey: leader.athlete.jersey,
                      position: leader.athlete.position?.abbreviation,
                    },
                  })) || [],
              })) || [],
          })) || [];

        // Extract scoring plays
        const scoringPlays =
          data.scoringPlays?.map((play: ESPNScoringPlay) => ({
            id: play.id,
            type: play.type?.text,
            text: play.text,
            awayScore: play.awayScore,
            homeScore: play.homeScore,
            period: play.period?.number,
            clock: play.clock?.displayValue,
            team: {
              id: play.team.id,
              abbreviation: play.team.abbreviation,
              displayName: play.team.displayName,
            },
          })) || [];

        // Extract drives
        const currentDrive = data.drives?.current as ESPNDrive | undefined;
        const previousDrives = (data.drives?.previous || []) as ESPNDrive[];

        const drives = {
          current: currentDrive
            ? {
                id: currentDrive.id,
                description: currentDrive.description,
                team: {
                  id: currentDrive.team.id,
                  abbreviation: currentDrive.team.abbreviation,
                  displayName: currentDrive.team.displayName,
                },
                start: currentDrive.start,
                timeElapsed: currentDrive.timeElapsed,
              }
            : null,
          previous: previousDrives.map((drive) => ({
            id: drive.id,
            description: drive.description,
            team: {
              id: drive.team.id,
              abbreviation: drive.team.abbreviation,
              displayName: drive.team.displayName,
            },
            start: drive.start,
            end: drive.end,
            timeElapsed: drive.timeElapsed,
            result: drive.result,
          })),
        };

        return reply.success({
          boxscore,
          leaders,
          scoringPlays,
          drives,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to fetch game summary');
        return reply.status(400).send({
          error: 'Failed to fetch game summary',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
