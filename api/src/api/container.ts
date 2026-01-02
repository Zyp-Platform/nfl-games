import { ESPNProvider } from '../infrastructure/providers/espn/espn.provider.js';
import { ProviderGameRepository } from '../infrastructure/repositories/provider-game.repository.js';
import { InMemoryCacheService } from '../infrastructure/cache/cache.service.js';
import { InMemoryEventBus } from '../infrastructure/events/event-bus.js';
import { GetScoreboardUseCase } from '../application/use-cases/get-scoreboard.use-case.js';
import { GetLiveGamesUseCase } from '../application/use-cases/get-live-games.use-case.js';
import { GetGameDetailsUseCase } from '../application/use-cases/get-game-details.use-case.js';
import { GetScheduleUseCase } from '../application/use-cases/get-schedule.use-case.js';

/**
 * Dependency Injection Container
 * Creates and wires up all application dependencies
 */
export interface Container {
  // Infrastructure
  cacheService: InMemoryCacheService;
  eventBus: InMemoryEventBus;

  // Providers
  espnProvider: ESPNProvider;

  // Repositories
  gameRepository: ProviderGameRepository;

  // Use Cases
  getScoreboardUseCase: GetScoreboardUseCase;
  getLiveGamesUseCase: GetLiveGamesUseCase;
  getGameDetailsUseCase: GetGameDetailsUseCase;
  getScheduleUseCase: GetScheduleUseCase;
}

/**
 * Create and configure the dependency injection container
 */
export function createContainer(): Container {
  // Infrastructure layer
  const cacheService = new InMemoryCacheService();
  const eventBus = new InMemoryEventBus();

  // Provider layer
  const espnProvider = new ESPNProvider({
    rateLimiter: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    },
    circuitBreaker: {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '50', 10),
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '60000', 10),
      minimumRequests: parseInt(process.env.CIRCUIT_BREAKER_MIN_REQUESTS || '10', 10),
      successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '3', 10),
    },
    timeout: parseInt(process.env.ESPN_TIMEOUT || '10000', 10),
  });

  // Repository layer
  // Default: ESPN provider-based repository (reads from API)
  const gameRepository = new ProviderGameRepository(espnProvider);

  // Alternative: Use Prisma-based repository for database persistence
  // Uncomment to use database-backed repository instead:
  // const gameRepository = new PrismaGameRepository();

  // Application layer - Use Cases
  const getScoreboardUseCase = new GetScoreboardUseCase(gameRepository, cacheService, eventBus);

  const getLiveGamesUseCase = new GetLiveGamesUseCase(gameRepository, cacheService, eventBus);

  const getGameDetailsUseCase = new GetGameDetailsUseCase(gameRepository, cacheService, eventBus);

  const getScheduleUseCase = new GetScheduleUseCase(gameRepository, cacheService, eventBus);

  return {
    // Infrastructure
    cacheService,
    eventBus,

    // Providers
    espnProvider,

    // Repositories
    gameRepository,

    // Use Cases
    getScoreboardUseCase,
    getLiveGamesUseCase,
    getGameDetailsUseCase,
    getScheduleUseCase,
  };
}
