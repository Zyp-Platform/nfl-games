import type { Game } from '../../domain/entities/game.entity.js';
import type { IGameRepository } from '../../domain/repositories/game.repository.js';
import type { ICacheService } from '../../infrastructure/cache/cache.service.js';
import type { IEventBus } from '../../infrastructure/events/event-bus.js';

/**
 * Get Scoreboard Parameters
 */
export interface GetScoreboardParams {
  season: number;
  week: number;
  seasonType?: 'preseason' | 'regular' | 'postseason';
}

/**
 * Scoreboard Result
 */
export interface ScoreboardResult {
  games: Game[];
  fromCache: boolean;
  metadata: {
    season: number;
    week: number;
    seasonType: string;
    cachedAt?: Date;
    gameCount: number;
    liveGameCount: number;
  };
}

/**
 * Get Scoreboard Use Case
 * Fetches games for a specific week with intelligent caching
 */
export class GetScoreboardUseCase {
  constructor(
    private gameRepository: IGameRepository,
    private cacheService: ICacheService,
    private eventBus: IEventBus
  ) {}

  async execute(params: GetScoreboardParams): Promise<ScoreboardResult> {
    // Build cache key
    const cacheKey = this.buildCacheKey(params);

    // Try cache first
    const cached = await this.cacheService.get<ScoreboardResult>(cacheKey);
    if (cached && !this.shouldRefreshCache(cached)) {
      await this.eventBus.emit('scoreboard.cache-hit', {
        params,
        cachedAt: cached.metadata.cachedAt,
      });

      return { ...cached, fromCache: true };
    }

    // Fetch from repository
    const games = await this.gameRepository.findByWeek({
      season: params.season,
      week: params.week,
      seasonType: params.seasonType,
    });

    // Build result
    const result: ScoreboardResult = {
      games,
      fromCache: false,
      metadata: {
        season: params.season,
        week: params.week,
        seasonType: params.seasonType || 'regular',
        cachedAt: new Date(),
        gameCount: games.length,
        liveGameCount: games.filter((g) => g.isLive).length,
      },
    };

    // Cache with dynamic TTL
    const ttl = this.calculateCacheTTL(result);
    await this.cacheService.set(cacheKey, result, ttl);

    // Emit event
    await this.eventBus.emit('scoreboard.fetched', {
      params,
      gameCount: games.length,
      liveGameCount: result.metadata.liveGameCount,
      ttl,
    });

    return result;
  }

  /**
   * Build cache key
   */
  private buildCacheKey(params: GetScoreboardParams): string {
    const seasonType = params.seasonType || 'regular';
    return `scoreboard:${params.season}:${seasonType}:${params.week}`;
  }

  /**
   * Determine if cache should be refreshed
   */
  private shouldRefreshCache(cached: ScoreboardResult): boolean {
    if (!cached.metadata.cachedAt) {
      return true;
    }

    const cacheAge = Date.now() - new Date(cached.metadata.cachedAt).getTime();

    // If there are live games, refresh more frequently
    if (cached.metadata.liveGameCount > 0) {
      return cacheAge > 30 * 1000; // 30 seconds for live games
    }

    // For completed/scheduled games, longer TTL is fine
    return cacheAge > 5 * 60 * 1000; // 5 minutes for non-live
  }

  /**
   * Calculate cache TTL based on game states
   */
  private calculateCacheTTL(result: ScoreboardResult): number {
    // If there are live games, short TTL
    if (result.metadata.liveGameCount > 0) {
      return 30; // 30 seconds
    }

    // Check if week is in the past (all games completed)
    const allCompleted = result.games.every((g) => g.isCompleted);
    if (allCompleted) {
      return 3600; // 1 hour for completed games
    }

    // Check if week is in the future (all games scheduled)
    const allScheduled = result.games.every((g) => !g.isLive && !g.isCompleted);
    if (allScheduled) {
      return 300; // 5 minutes for future games
    }

    // Mixed states
    return 60; // 1 minute default
  }
}
