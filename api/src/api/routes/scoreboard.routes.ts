import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '@zyp/fastify-plugins';
import type { Container } from '../container.js';

/**
 * Scoreboard query parameters schema
 */
const scoreboardQuerySchema = z.object({
  season: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number),
  week: z.string().regex(/^\d+$/).transform(Number).optional(),
  seasonType: z.enum(['preseason', 'regular', 'postseason']).optional().default('regular'),
});

type ScoreboardQuery = z.infer<typeof scoreboardQuerySchema>;

/**
 * Scoreboard routes
 */
export async function scoreboardRoutes(fastify: FastifyInstance) {
  const container = (fastify as FastifyInstance & { container: Container }).container;

  /**
   * GET /api/v1/scoreboard
   * Get games for a specific week/season
   */
  fastify.get<{ Querystring: ScoreboardQuery }>(
    '/scoreboard',
    {
      schema: {
        tags: ['scoreboard'],
        summary: 'Get NFL scoreboard',
        description:
          'Retrieve games for a specific season and week with team details, scores, and status',
        querystring: {
          type: 'object',
          required: ['season'],
          properties: {
            season: {
              type: 'string',
              pattern: '^\\d{4}$',
              description: 'Season year (e.g., 2024)',
            },
            week: {
              type: 'string',
              pattern: '^\\d+$',
              description: 'Week number (1-18 for regular season)',
            },
            seasonType: {
              type: 'string',
              enum: ['preseason', 'regular', 'postseason'],
              default: 'regular',
              description: 'Type of season',
            },
          },
        },
        response: {
          200: {
            description: 'Successful response with games and metadata',
            type: 'object',
            additionalProperties: true,
          },
          400: {
            description: 'Invalid query parameters',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: ScoreboardQuery }>, reply) => {
      // Validate query parameters
      const validation = scoreboardQuerySchema.safeParse(request.query);

      if (!validation.success) {
        throw new ValidationError('Invalid query parameters', validation.error.format());
      }

      const { season, week, seasonType } = validation.data;

      // Week is required by the use case, default to 1 if not provided
      const effectiveWeek = week || 1;

      // Execute use case
      const result = await container.getScoreboardUseCase.execute({
        season,
        week: effectiveWeek,
        seasonType,
      });

      // Return response
      return reply.success({
        games: result.games.map((game) => game.toObject()),
        metadata: {
          season,
          week: effectiveWeek,
          seasonType,
          totalGames: result.games.length,
          liveGames: result.games.filter((g) => g.isLive).length,
          completedGames: result.games.filter((g) => g.isCompleted).length,
          cacheHit: result.fromCache,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}
