import type { Game } from '../../../domain/entities/game.entity.js';
import type { RateLimiterConfig } from '../../resilience/rate-limiter.js';
import { RateLimiter } from '../../resilience/rate-limiter.js';
import type {
  CircuitBreakerConfig} from '../../resilience/circuit-breaker.js';
import {
  CircuitBreaker,
  CircuitState,
} from '../../resilience/circuit-breaker.js';
import type { GetGamesParams} from './provider-types.js';
import { ProviderError, ProviderUnavailableError } from './provider-types.js';

/**
 * Provider Configuration
 */
export interface ProviderConfig {
  name: string;
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  rateLimiter: RateLimiterConfig;
  circuitBreaker: CircuitBreakerConfig;
}

/**
 * Logger Interface
 */
export interface ILogger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, error?: Error, meta?: unknown): void;
}

/**
 * Metrics Collector Interface
 */
export interface IMetricsCollector {
  recordRequest(provider: string, operation: string, durationMs: number, success: boolean): void;
  recordError(provider: string, operation: string, errorType: string): void;
  recordCacheHit(provider: string, operation: string): void;
  recordCacheMiss(provider: string, operation: string): void;
}

/**
 * Simple Console Logger (default implementation)
 */
export class ConsoleLogger implements ILogger {
  debug(message: string, meta?: unknown): void {
    console.debug(message, meta || '');
  }

  info(message: string, meta?: unknown): void {
    console.info(message, meta || '');
  }

  warn(message: string, meta?: unknown): void {
    console.warn(message, meta || '');
  }

  error(message: string, error?: Error, meta?: unknown): void {
    console.error(message, error, meta || '');
  }
}

/**
 * Simple Metrics Collector (default implementation)
 */
export class SimpleMetricsCollector implements IMetricsCollector {
  recordRequest(provider: string, operation: string, durationMs: number, success: boolean): void {
    console.log(`[METRICS] ${provider}.${operation}: ${durationMs}ms, success=${success}`);
  }

  recordError(provider: string, operation: string, errorType: string): void {
    console.log(`[METRICS] ${provider}.${operation} error: ${errorType}`);
  }

  recordCacheHit(provider: string, operation: string): void {
    console.log(`[METRICS] ${provider}.${operation}: cache hit`);
  }

  recordCacheMiss(provider: string, operation: string): void {
    console.log(`[METRICS] ${provider}.${operation}: cache miss`);
  }
}

/**
 * Abstract Sports Data Provider
 * Base class for all provider implementations
 */
export abstract class SportsDataProvider {
  protected rateLimiter: RateLimiter;
  protected circuitBreaker: CircuitBreaker;
  protected logger: ILogger;
  protected metrics: IMetricsCollector;

  constructor(
    protected config: ProviderConfig,
    logger?: ILogger,
    metrics?: IMetricsCollector
  ) {
    this.rateLimiter = new RateLimiter(config.rateLimiter);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.logger = logger || new ConsoleLogger();
    this.metrics = metrics || new SimpleMetricsCollector();
  }

  /**
   * Get provider name
   */
  abstract getName(): string;

  /**
   * Fetch games from the provider
   */
  abstract getGames(params: GetGamesParams): Promise<Game[]>;

  /**
   * Check if provider is available
   */
  isAvailable(): boolean {
    return this.circuitBreaker.getState() !== CircuitState.OPEN;
  }

  /**
   * Get provider health metrics
   */
  getMetrics() {
    return {
      name: this.getName(),
      circuitBreaker: this.circuitBreaker.getMetrics(),
      rateLimiter: {
        availableTokens: this.rateLimiter.getAvailableTokens(),
      },
    };
  }

  /**
   * Execute a request with resilience patterns
   */
  protected async executeRequest<T>(operation: string, request: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      // Check circuit breaker
      if (!this.circuitBreaker.allowRequest()) {
        const error = new ProviderUnavailableError(`${this.getName()} circuit breaker is open`);
        this.logger.warn('Circuit breaker open', {
          provider: this.getName(),
          operation,
        });
        throw error;
      }

      // Apply rate limiting
      this.logger.debug('Acquiring rate limit token', {
        provider: this.getName(),
        operation,
      });

      await this.rateLimiter.acquire();

      // Execute the actual request
      this.logger.debug('Executing request', {
        provider: this.getName(),
        operation,
      });

      const result = await request();

      // Record success
      const duration = Date.now() - startTime;
      this.circuitBreaker.recordSuccess();
      this.metrics.recordRequest(this.getName(), operation, duration, true);

      this.logger.info('Request successful', {
        provider: this.getName(),
        operation,
        durationMs: duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failure
      this.circuitBreaker.recordFailure();
      this.metrics.recordRequest(this.getName(), operation, duration, false);

      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      this.metrics.recordError(this.getName(), operation, errorType);

      // Log error
      this.logger.error(
        `Request failed`,
        error instanceof Error ? error : new Error(String(error)),
        {
          provider: this.getName(),
          operation,
          durationMs: duration,
        }
      );

      // Wrap and throw
      throw new ProviderError(
        this.getName(),
        operation,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Reset resilience state (for testing or manual recovery)
   */
  reset(): void {
    this.rateLimiter.reset();
    this.circuitBreaker.reset();
  }
}
