import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { responseHelpers, errorHandler } from '@zyp/fastify-plugins';
import { gamesRoutes } from './games.routes.js';
import type { Container } from '../container.js';
import type { GetLiveGamesUseCase, LiveGamesResult } from '../../application/use-cases/get-live-games.use-case.js';
import type { GetGameDetailsUseCase } from '../../application/use-cases/get-game-details.use-case.js';
import { Game } from '../../domain/entities/game.entity.js';
import { ExternalIds } from '../../domain/value-objects/external-ids.js';
import { Score } from '../../domain/value-objects/score.js';
import { TeamReference } from '../../domain/entities/team.entity.js';

describe('Games Routes', () => {
  let fastify: FastifyInstance;
  let mockGetLiveGamesUseCase: Partial<GetLiveGamesUseCase>;
  let mockGetGameDetailsUseCase: Partial<GetGameDetailsUseCase>;

  // Helper function to create a test game
  const createTestGame = (id: string, homeScore: number, awayScore: number): Game => {
    return new Game(
      id,
      new ExternalIds('espn', id, {}),
      new TeamReference('home-team', 'HOME', 'Home Team', 'Home', 'https://logo.url'),
      new TeamReference('away-team', 'AWAY', 'Away Team', 'Away', 'https://logo.url'),
      'in-progress',
      new Score(homeScore, awayScore),
      new Date(),
      {
        season: 2024,
        seasonType: 'regular',
        week: 1,
        lastModified: new Date(),
      }
    );
  };

  beforeEach(async () => {
    // Create fresh Fastify instance
    fastify = Fastify();

    // Create mock use cases
    mockGetLiveGamesUseCase = {
      execute: vi.fn(),
    };

    mockGetGameDetailsUseCase = {
      execute: vi.fn(),
    };

    // Create mock container
    const mockContainer = {
      getLiveGamesUseCase: mockGetLiveGamesUseCase as GetLiveGamesUseCase,
      getGameDetailsUseCase: mockGetGameDetailsUseCase as GetGameDetailsUseCase,
    } as Container;

    // Attach container to fastify
    fastify.decorate('container', mockContainer);

    // Register plugins (MUST be before routes, same order as production)
    await fastify.register(responseHelpers);
    await fastify.register(errorHandler);

    // Register routes
    await fastify.register(gamesRoutes, { prefix: '/api/v1' });
  });

  describe('GET /games/live', () => {
    it('should return live games successfully', async () => {
      const liveGames = [
        createTestGame('game-1', 14, 7),
        createTestGame('game-2', 21, 10),
        createTestGame('game-3', 7, 14),
      ];

      const mockResult: LiveGamesResult = {
        games: liveGames,
        fromCache: false,
        metadata: {
          cachedAt: new Date(),
          gameCount: 3,
        },
      };

      vi.mocked(mockGetLiveGamesUseCase.execute!).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.games).toHaveLength(3);
      expect(body.data.metadata.totalLiveGames).toBe(3);
      expect(body.data.metadata.cacheHit).toBe(false);
      expect(body.data.metadata.timestamp).toBeDefined();
    });

    it('should return empty array when no live games', async () => {
      const mockResult: LiveGamesResult = {
        games: [],
        fromCache: false,
        metadata: {
          cachedAt: new Date(),
          gameCount: 0,
        },
      };

      vi.mocked(mockGetLiveGamesUseCase.execute!).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.games).toHaveLength(0);
      expect(body.data.metadata.totalLiveGames).toBe(0);
    });

    it('should indicate cache hit in metadata', async () => {
      const mockResult: LiveGamesResult = {
        games: [createTestGame('game-1', 14, 7)],
        fromCache: true,
        metadata: {
          cachedAt: new Date(),
          gameCount: 1,
        },
      };

      vi.mocked(mockGetLiveGamesUseCase.execute!).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.metadata.cacheHit).toBe(true);
    });

    it('should count clutch time games', async () => {
      // Create games with clutch time conditions
      const game1 = createTestGame('game-1', 21, 20);
      const game2 = createTestGame('game-2', 14, 7);

      const mockResult: LiveGamesResult = {
        games: [game1, game2],
        fromCache: false,
        metadata: {
          cachedAt: new Date(),
          gameCount: 2,
        },
      };

      vi.mocked(mockGetLiveGamesUseCase.execute!).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.metadata.clutchTimeGames).toBeDefined();
    });

    it('should handle use case errors', async () => {
      vi.mocked(mockGetLiveGamesUseCase.execute!).mockRejectedValue(
        new Error('Database error')
      );

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /games/:id', () => {
    it('should return game details for valid ID', async () => {
      const game = createTestGame('game-123', 14, 7);

      vi.mocked(mockGetGameDetailsUseCase.execute!).mockResolvedValue({
        game,
        fromCache: false,
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/game-123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.game).toBeDefined();
      expect(body.data.game.id).toBe('game-123');
      expect(body.data.metadata.cacheHit).toBe(false);
    });

    it('should return 404 when game not found', async () => {
      vi.mocked(mockGetGameDetailsUseCase.execute!).mockResolvedValue({
        game: null,
        fromCache: false,
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 422 for invalid game ID', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/',
      });

      expect(response.statusCode).toBe(422); // Validation error (Unprocessable Entity)
    });

    it('should validate game ID parameter', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/',
      });

      // Empty ID should result in 422 (validation error - Unprocessable Entity)
      expect(response.statusCode).toBe(422);
    });

    it('should include metadata in response', async () => {
      const game = createTestGame('game-456', 21, 14);

      vi.mocked(mockGetGameDetailsUseCase.execute!).mockResolvedValue({
        game,
        fromCache: true,
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/game-456',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.metadata).toBeDefined();
      expect(body.data.metadata.cacheHit).toBe(true);
      expect(body.data.metadata.timestamp).toBeDefined();
    });

    it('should handle special characters in game ID', async () => {
      const gameId = 'game-123-special';
      const game = createTestGame(gameId, 14, 7);

      vi.mocked(mockGetGameDetailsUseCase.execute!).mockResolvedValue({
        game,
        fromCache: false,
      });

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/games/${encodeURIComponent(gameId)}`,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Error handling', () => {
    it('should handle use case exceptions', async () => {
      vi.mocked(mockGetLiveGamesUseCase.execute!).mockRejectedValue(
        new Error('Unexpected error')
      );

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should handle malformed requests', async () => {
      const response = await fastify.inject({
        method: 'POST', // Wrong method
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBe(404); // Route not found
    });
  });

  describe('Response format', () => {
    it('should return proper JSON response', async () => {
      const mockResult: LiveGamesResult = {
        games: [],
        fromCache: false,
        metadata: {
          cachedAt: new Date(),
          gameCount: 0,
        },
      };

      vi.mocked(mockGetLiveGamesUseCase.execute!).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.headers['content-type']).toContain('application/json');
      expect(() => JSON.parse(response.body)).not.toThrow();
    });

    it('should serialize game objects properly', async () => {
      const game = createTestGame('game-789', 28, 21);

      const mockResult: LiveGamesResult = {
        games: [game],
        fromCache: false,
        metadata: {
          cachedAt: new Date(),
          gameCount: 1,
        },
      };

      vi.mocked(mockGetLiveGamesUseCase.execute!).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.games[0].id).toBe('game-789');
      expect(body.data.games[0].homeTeam).toBeDefined();
      expect(body.data.games[0].awayTeam).toBeDefined();
      expect(body.data.games[0].score).toBeDefined();
    });
  });
});
