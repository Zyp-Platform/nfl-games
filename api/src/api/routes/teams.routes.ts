import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '@zyp/fastify-plugins';
import type { Container } from '../container.js';

/**
 * Route parameter schema for team ID
 */
const teamIdParamSchema = z.object({
  teamId: z.string().min(1),
});

/**
 * Query parameter schema for season
 */
const seasonQuerySchema = z.object({
  season: z.string().regex(/^\d{4}$/),
});

/**
 * Teams routes
 */
export async function teamsRoutes(fastify: FastifyInstance) {
  const container = (fastify as FastifyInstance & { container: Container }).container;

  /**
   * GET /api/v1/teams/:teamId/games
   * Get all games for a specific team across all weeks and season types
   */
  fastify.get<{ Params: { teamId: string }; Querystring: { season: string } }>(
    '/teams/:teamId/games',
    {
      schema: {
        tags: ['teams'],
        summary: 'Get all games for a team',
        description:
          'Retrieve all games for a specific team across all weeks and season types for a season',
        params: {
          type: 'object',
          required: ['teamId'],
          properties: {
            teamId: { type: 'string', description: 'Team ID' },
          },
        },
        querystring: {
          type: 'object',
          required: ['season'],
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
            description: 'Successful response with all team games',
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
    async (
      request: FastifyRequest<{ Params: { teamId: string }; Querystring: { season: string } }>,
      reply
    ) => {
      // Validate params
      const paramsValidation = teamIdParamSchema.safeParse(request.params);
      if (!paramsValidation.success) {
        throw new ValidationError('Invalid route parameters', paramsValidation.error);
      }
      const { teamId } = paramsValidation.data;

      // Validate query
      const queryValidation = seasonQuerySchema.safeParse(request.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error);
      }
      const { season } = queryValidation.data;
      const seasonNum = parseInt(season, 10);

      // Fetch games from all weeks (1-18) and all season types
      const allGames = [];
      const seasonTypes: Array<'preseason' | 'regular' | 'postseason'> = [
        'preseason',
        'regular',
        'postseason',
      ];

      for (const seasonType of seasonTypes) {
        const maxWeeks = seasonType === 'regular' ? 18 : 4;

        for (let week = 1; week <= maxWeeks; week++) {
          try {
            const result = await container.getScoreboardUseCase.execute({
              season: seasonNum,
              week,
              seasonType,
            });

            // Filter games where this team is playing
            const teamGames = result.games.filter(
              (game) => game.homeTeam.id === teamId || game.awayTeam.id === teamId
            );

            allGames.push(...teamGames);
          } catch {
            // Continue if week doesn't exist
            continue;
          }
        }
      }

      // Sort by date (most recent first)
      allGames.sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );

      // Get team info from first game
      const firstGame = allGames[0];
      const team = firstGame?.homeTeam.id === teamId ? firstGame.homeTeam : firstGame?.awayTeam;

      return reply.success({
        team: team
          ? {
              id: team.id,
              abbreviation: team.abbreviation,
              displayName: team.displayName,
              logo: team.logo,
            }
          : null,
        games: allGames.map((game) => game.toObject()),
        metadata: {
          season: seasonNum,
          totalGames: allGames.length,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}
