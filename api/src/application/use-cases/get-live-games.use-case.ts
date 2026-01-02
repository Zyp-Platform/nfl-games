import type { Game } from '../../domain/entities/game.entity.js';
import type { IGameRepository } from '../../domain/repositories/game.repository.js';
import type { ICacheService } from '../../infrastructure/cache/cache.service.js';
import type { IEventBus } from '../../infrastructure/events/event-bus.js';

/**
 * Live Games Result
 */
export interface LiveGamesResult {
  games: Game[];
  fromCache: boolean;
  metadata: {
    cachedAt: Date;
    gameCount: number;
  };
}

/**
 * Get Live Games Use Case
 * Fetches currently in-progress games with short cache TTL
 */
export class GetLiveGamesUseCase {
  private readonly CACHE_KEY = 'games:live';
  private readonly CACHE_TTL = 15; // 15 seconds for live games

  constructor(
    private gameRepository: IGameRepository,
    private cacheService: ICacheService,
    private eventBus: IEventBus
  ) {}

  async execute(): Promise<LiveGamesResult> {
    // Try cache first (very short TTL)
    const cached = await this.cacheService.get<LiveGamesResult>(this.CACHE_KEY);

    if (cached) {
      await this.eventBus.emit('live-games.cache-hit', {
        cachedAt: cached.metadata.cachedAt,
        gameCount: cached.games.length,
      });

      return { ...cached, fromCache: true };
    }

    // Fetch live games
    const games = await this.gameRepository.findLive();

    // Build result
    const result: LiveGamesResult = {
      games,
      fromCache: false,
      metadata: {
        cachedAt: new Date(),
        gameCount: games.length,
      },
    };

    // Cache with short TTL
    await this.cacheService.set(this.CACHE_KEY, result, this.CACHE_TTL);

    // Emit event
    await this.eventBus.emit('live-games.fetched', {
      gameCount: games.length,
      ttl: this.CACHE_TTL,
    });

    return result;
  }
}
