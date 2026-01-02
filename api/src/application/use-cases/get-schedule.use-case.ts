import type { Game } from '../../domain/entities/game.entity.js';
import type { IGameRepository } from '../../domain/repositories/game.repository.js';
import type { ICacheService } from '../../infrastructure/cache/cache.service.js';
import type { IEventBus } from '../../infrastructure/events/event-bus.js';

/**
 * Get Schedule Parameters
 */
export interface GetScheduleParams {
  season: number;
  week?: number;
  seasonType?: 'preseason' | 'regular' | 'postseason';
}

/**
 * Schedule Result
 */
export interface ScheduleResult {
  games: Game[];
  fromCache: boolean;
  metadata: {
    season: number;
    week?: number;
    seasonType: string;
    cachedAt?: Date;
    gameCount: number;
    upcomingGameCount: number;
  };
}

/**
 * Get Schedule Use Case
 * Fetches scheduled (unplayed) games with intelligent caching
 */
export class GetScheduleUseCase {
  constructor(
    private gameRepository: IGameRepository,
    private cacheService: ICacheService,
    private eventBus: IEventBus
  ) {}

  async execute(params: GetScheduleParams): Promise<ScheduleResult> {
    // Build cache key
    const cacheKey = this.buildCacheKey(params);

    // Try cache first
    const cached = await this.cacheService.get<ScheduleResult>(cacheKey);
    if (cached && !this.shouldRefreshCache(cached)) {
      await this.eventBus.emit('schedule.cache-hit', {
        params,
        cachedAt: cached.metadata.cachedAt,
      });

      return { ...cached, fromCache: true };
    }

    // Fetch from repository
    // Use findByFilter since week is optional for schedule queries
    const games = params.week
      ? await this.gameRepository.findByWeek({
          season: params.season,
          week: params.week,
          seasonType: params.seasonType,
        })
      : await this.gameRepository.findByFilter({
          season: params.season,
          seasonType: params.seasonType,
        });

    // Filter for scheduled games (not live, not completed)
    const scheduledGames = games.filter((g) => !g.isLive && !g.isCompleted);

    // Sort by scheduled time (earliest first)
    scheduledGames.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    // Build result
    const result: ScheduleResult = {
      games: scheduledGames,
      fromCache: false,
      metadata: {
        season: params.season,
        week: params.week,
        seasonType: params.seasonType || 'regular',
        cachedAt: new Date(),
        gameCount: scheduledGames.length,
        upcomingGameCount: scheduledGames.length,
      },
    };

    // Cache with 5 minute TTL (scheduled games don't change frequently)
    const ttl = this.calculateCacheTTL();
    await this.cacheService.set(cacheKey, result, ttl);

    // Emit event
    await this.eventBus.emit('schedule.fetched', {
      params,
      gameCount: scheduledGames.length,
      ttl,
    });

    return result;
  }

  /**
   * Build cache key
   */
  private buildCacheKey(params: GetScheduleParams): string {
    const seasonType = params.seasonType || 'regular';
    const weekPart = params.week ? `:${params.week}` : ':all';
    return `schedule:${params.season}:${seasonType}${weekPart}`;
  }

  /**
   * Determine if cache should be refreshed
   */
  private shouldRefreshCache(cached: ScheduleResult): boolean {
    if (!cached.metadata.cachedAt) {
      return true;
    }

    const cacheAge = Date.now() - new Date(cached.metadata.cachedAt).getTime();

    // Scheduled games change infrequently - 5 minute TTL
    return cacheAge > 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate cache TTL for scheduled games
   */
  private calculateCacheTTL(): number {
    // Scheduled games are stable - use 5 minute cache
    return 300; // 5 minutes
  }
}
