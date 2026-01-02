import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LiveGamesResult } from './get-live-games.use-case.js';
import { GetLiveGamesUseCase } from './get-live-games.use-case.js';
import type { IGameRepository } from '../../domain/repositories/game.repository.js';
import type { ICacheService } from '../../infrastructure/cache/cache.service.js';
import type { IEventBus } from '../../infrastructure/events/event-bus.js';
import { Game } from '../../domain/entities/game.entity.js';
import { ExternalIds } from '../../domain/value-objects/external-ids.js';
import { Score } from '../../domain/value-objects/score.js';
import { TeamReference } from '../../domain/entities/team.entity.js';

describe('GetLiveGamesUseCase', () => {
  let useCase: GetLiveGamesUseCase;
  let mockGameRepository: IGameRepository;
  let mockCacheService: ICacheService;
  let mockEventBus: IEventBus;

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

  beforeEach(() => {
    // Create mocks
    mockGameRepository = {
      findById: vi.fn(),
      findByExternalId: vi.fn(),
      findByDateRange: vi.fn(),
      findByWeek: vi.fn(),
      findLive: vi.fn(),
      findByFilter: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
    };

    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
    };

    useCase = new GetLiveGamesUseCase(mockGameRepository, mockCacheService, mockEventBus);
  });

  describe('execute', () => {
    it('should return cached data when cache hit occurs', async () => {
      const cachedAt = new Date('2024-01-01T12:00:00Z');
      const cachedResult: LiveGamesResult = {
        games: [createTestGame('game-1', 14, 7), createTestGame('game-2', 21, 10)],
        fromCache: false,
        metadata: {
          cachedAt,
          gameCount: 2,
        },
      };

      vi.mocked(mockCacheService.get).mockResolvedValue(cachedResult);

      const result = await useCase.execute();

      expect(result.fromCache).toBe(true);
      expect(result.games.length).toBe(2);
      expect(result.metadata.gameCount).toBe(2);
      expect(mockGameRepository.findLive).not.toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith('live-games.cache-hit', {
        cachedAt,
        gameCount: 2,
      });
    });

    it('should fetch from repository on cache miss', async () => {
      const liveGames = [
        createTestGame('game-1', 14, 7),
        createTestGame('game-2', 21, 10),
        createTestGame('game-3', 7, 14),
      ];

      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue(liveGames);

      const result = await useCase.execute();

      expect(result.fromCache).toBe(false);
      expect(result.games.length).toBe(3);
      expect(result.metadata.gameCount).toBe(3);
      expect(mockGameRepository.findLive).toHaveBeenCalledTimes(1);
    });

    it('should cache the result after fetching from repository', async () => {
      const liveGames = [createTestGame('game-1', 14, 7)];

      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue(liveGames);

      await useCase.execute();

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'games:live',
        expect.objectContaining({
          games: liveGames,
          fromCache: false,
          metadata: expect.objectContaining({
            gameCount: 1,
          }),
        }),
        15 // TTL
      );
    });

    it('should emit fetched event with correct data', async () => {
      const liveGames = [createTestGame('game-1', 14, 7), createTestGame('game-2', 21, 10)];

      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue(liveGames);

      await useCase.execute();

      expect(mockEventBus.emit).toHaveBeenCalledWith('live-games.fetched', {
        gameCount: 2,
        ttl: 15,
      });
    });

    it('should handle empty live games list', async () => {
      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.games.length).toBe(0);
      expect(result.metadata.gameCount).toBe(0);
      expect(result.fromCache).toBe(false);
    });

    it('should set correct cache TTL', async () => {
      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue([]);

      await useCase.execute();

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'games:live',
        expect.any(Object),
        15 // 15 seconds TTL for live games
      );
    });

    it('should include cachedAt timestamp in metadata', async () => {
      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue([]);

      const beforeExecution = new Date();
      const result = await useCase.execute();
      const afterExecution = new Date();

      expect(result.metadata.cachedAt.getTime()).toBeGreaterThanOrEqual(
        beforeExecution.getTime()
      );
      expect(result.metadata.cachedAt.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
    });
  });

  describe('caching behavior', () => {
    it('should use correct cache key', async () => {
      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue([]);

      await useCase.execute();

      expect(mockCacheService.get).toHaveBeenCalledWith('games:live');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'games:live',
        expect.any(Object),
        expect.any(Number)
      );
    });

    it('should return games from cache without repository call', async () => {
      const cachedGames = [createTestGame('cached-game', 14, 7)];
      const cachedResult: LiveGamesResult = {
        games: cachedGames,
        fromCache: false,
        metadata: {
          cachedAt: new Date(),
          gameCount: 1,
        },
      };

      vi.mocked(mockCacheService.get).mockResolvedValue(cachedResult);

      await useCase.execute();

      expect(mockGameRepository.findLive).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('event emission', () => {
    it('should emit cache-hit event with metadata', async () => {
      const cachedAt = new Date();
      const cachedResult: LiveGamesResult = {
        games: [createTestGame('game-1', 14, 7)],
        fromCache: false,
        metadata: { cachedAt, gameCount: 1 },
      };

      vi.mocked(mockCacheService.get).mockResolvedValue(cachedResult);

      await useCase.execute();

      expect(mockEventBus.emit).toHaveBeenCalledWith('live-games.cache-hit', {
        cachedAt,
        gameCount: 1,
      });
    });

    it('should emit fetched event with game count and TTL', async () => {
      const games = [createTestGame('game-1', 14, 7), createTestGame('game-2', 21, 10)];

      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue(games);

      await useCase.execute();

      expect(mockEventBus.emit).toHaveBeenCalledWith('live-games.fetched', {
        gameCount: 2,
        ttl: 15,
      });
    });

    it('should not emit fetched event on cache hit', async () => {
      const cachedResult: LiveGamesResult = {
        games: [createTestGame('game-1', 14, 7)],
        fromCache: false,
        metadata: { cachedAt: new Date(), gameCount: 1 },
      };

      vi.mocked(mockCacheService.get).mockResolvedValue(cachedResult);

      await useCase.execute();

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'live-games.cache-hit',
        expect.any(Object)
      );
      expect(mockEventBus.emit).not.toHaveBeenCalledWith(
        'live-games.fetched',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(useCase.execute()).rejects.toThrow('Database connection failed');
    });

    it('should handle cache service errors gracefully', async () => {
      vi.mocked(mockCacheService.get).mockRejectedValue(new Error('Cache unavailable'));
      vi.mocked(mockGameRepository.findLive).mockResolvedValue([]);

      // Should continue without cache and fetch from repository
      await expect(useCase.execute()).rejects.toThrow('Cache unavailable');
    });

    it('should propagate event bus errors', async () => {
      vi.mocked(mockCacheService.get).mockResolvedValue(null);
      vi.mocked(mockGameRepository.findLive).mockResolvedValue([]);
      vi.mocked(mockEventBus.emit).mockRejectedValue(new Error('Event bus error'));

      await expect(useCase.execute()).rejects.toThrow('Event bus error');
    });
  });
});
