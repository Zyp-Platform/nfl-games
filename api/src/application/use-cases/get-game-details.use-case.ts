import type { Game } from '../../domain/entities/game.entity.js';
import type { IGameRepository } from '../../domain/repositories/game.repository.js';
import type { ICacheService } from '../../infrastructure/cache/cache.service.js';
import type { IEventBus } from '../../infrastructure/events/event-bus.js';

/**
 * Get Game Details Parameters
 */
export interface GetGameDetailsParams {
  gameId: string;
}

/**
 * Game Details Result
 */
export interface GameDetailsResult {
  game: Game | null;
  fromCache: boolean;
  metadata: {
    cachedAt: Date;
  };
}

/**
 * Get Game Details Use Case
 * Fetches a single game with dynamic caching based on game state
 */
export class GetGameDetailsUseCase {
  constructor(
    private gameRepository: IGameRepository,
    private cacheService: ICacheService,
    private eventBus: IEventBus
  ) {}

  async execute(params: GetGameDetailsParams): Promise<GameDetailsResult> {
    const cacheKey = this.buildCacheKey(params.gameId);

    // Try cache first
    const cached = await this.cacheService.get<GameDetailsResult>(cacheKey);

    if (cached && cached.game && !this.shouldRefreshCache(cached)) {
      await this.eventBus.emit('game-details.cache-hit', {
        gameId: params.gameId,
        cachedAt: cached.metadata.cachedAt,
      });

      return { ...cached, fromCache: true };
    }

    // Fetch from repository
    const game = await this.gameRepository.findById(params.gameId);

    // Build result
    const result: GameDetailsResult = {
      game,
      fromCache: false,
      metadata: {
        cachedAt: new Date(),
      },
    };

    // Cache with dynamic TTL if game was found
    if (game) {
      const ttl = this.calculateCacheTTL(game);
      await this.cacheService.set(cacheKey, result, ttl);

      // Emit event
      await this.eventBus.emit('game-details.fetched', {
        gameId: params.gameId,
        status: game.status,
        ttl,
      });
    }

    return result;
  }

  /**
   * Build cache key for a game
   */
  private buildCacheKey(gameId: string): string {
    return `game:${gameId}`;
  }

  /**
   * Determine if cache should be refreshed
   */
  private shouldRefreshCache(cached: GameDetailsResult): boolean {
    if (!cached.game) return true;

    const cacheAge = Date.now() - new Date(cached.metadata.cachedAt).getTime();
    const game = cached.game;

    // Live game: refresh frequently
    if (game.isLive) {
      return cacheAge > 15 * 1000; // 15 seconds
    }

    // Completed game: long cache OK
    if (game.isCompleted) {
      return cacheAge > 3600 * 1000; // 1 hour
    }

    // Scheduled game: moderate cache
    return cacheAge > 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate cache TTL based on game state
   */
  private calculateCacheTTL(game: Game): number {
    // Live game: very short TTL
    if (game.isLive) {
      return 15; // 15 seconds
    }

    // Completed game: long TTL
    if (game.isCompleted) {
      return 3600; // 1 hour
    }

    // Scheduled game: moderate TTL
    return 300; // 5 minutes
  }
}
