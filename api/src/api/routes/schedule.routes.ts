import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '@zyp/fastify-plugins';
import type { Container } from '../container.js';

/**
 * Schedule query parameters schema
 */
const scheduleQuerySchema = z.object({
  season: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number),
  week: z.string().regex(/^\d+$/).transform(Number).optional(),
  seasonType: z.enum(['preseason', 'regular', 'postseason']).optional().default('regular'),
});

type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;

/**
 * Schedule routes
 */
export async function scheduleRoutes(fastify: FastifyInstance) {
  const container = (fastify as FastifyInstance & { container: Container }).container;

  /**
   * GET /api/v1/schedule
   * Get scheduled (unplayed) games for a specific week/season
   */
  fastify.get<{ Querystring: ScheduleQuery }>(
    '/schedule',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get NFL schedule',
        description: 'Retrieve scheduled (unplayed) games for a specific season and week',
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
              description: 'Week number (1-18 for regular season, optional)',
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
            description: 'Successful response with scheduled games and metadata',
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
    async (request: FastifyRequest<{ Querystring: ScheduleQuery }>, reply) => {
      // Validate query parameters
      const validation = scheduleQuerySchema.safeParse(request.query);

      if (!validation.success) {
        throw new ValidationError('Invalid query parameters', validation.error.format());
      }

      const { season, week, seasonType } = validation.data;

      // Execute use case
      const result = await container.getScheduleUseCase.execute({
        season,
        week,
        seasonType,
      });

      // Return response
      return reply.success({
        games: result.games.map((game) => game.toObject()),
        metadata: {
          season,
          week: week || 'all',
          seasonType,
          totalGames: result.games.length,
          upcomingGames: result.games.length,
          cacheHit: result.fromCache,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}
