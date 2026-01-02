import type { Game } from '../../../domain/entities/game.entity.js';
import type {
  ProviderConfig,
  ILogger,
  IMetricsCollector} from '../base/sports-data-provider.js';
import {
  SportsDataProvider
} from '../base/sports-data-provider.js';
import type { GetGamesParams } from '../base/provider-types.js';
import type { ESPNScoreboardResponse } from './espn-types.js';
import { ESPNTransformer } from './espn-transformer.js';

/**
 * ESPN Provider Configuration
 */
export interface ESPNProviderConfig extends Partial<ProviderConfig> {
  baseUrl?: string;
  logger?: ILogger;
  metrics?: IMetricsCollector;
}

/**
 * ESPN Sports Data Provider
 * Free, public API - no authentication required
 */
export class ESPNProvider extends SportsDataProvider {
  private readonly baseUrl: string;

  constructor(config?: ESPNProviderConfig) {
    const defaultConfig: ProviderConfig = {
      name: 'ESPN',
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
      rateLimiter: {
        maxRequests: 100,
        windowMs: 60000, // 100 requests per minute
      },
      circuitBreaker: {
        failureThreshold: 50,
        minimumRequests: 5,
        resetTimeout: 60000, // 1 minute
      },
      ...config,
    };

    super(defaultConfig, config?.logger, config?.metrics);
    this.baseUrl = defaultConfig.baseUrl!;
  }

  getName(): string {
    return 'ESPN';
  }

  /**
   * Fetch games from ESPN API
   */
  async getGames(params: GetGamesParams): Promise<Game[]> {
    return this.executeRequest('getGames', async () => {
      const url = this.buildScoreboardUrl(params);

      this.logger.info('Fetching from ESPN', { url, params });

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout || 10000),
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as ESPNScoreboardResponse;

      this.logger.debug('ESPN response received', {
        eventCount: data.events?.length || 0,
      });

      // Transform ESPN events to Game entities
      const games = (data.events || [])
        .map((event) => {
          try {
            return ESPNTransformer.toGame(event);
          } catch (error) {
            this.logger.warn('Failed to transform ESPN event', {
              eventId: event.id,
              error: error instanceof Error ? error.message : String(error),
            });
            return null;
          }
        })
        .filter((game): game is Game => game !== null);

      this.logger.info('ESPN games fetched', {
        requestedCount: data.events?.length || 0,
        transformedCount: games.length,
      });

      return games;
    });
  }

  /**
   * Build ESPN scoreboard URL with parameters
   */
  private buildScoreboardUrl(params: GetGamesParams): string {
    const url = new URL(`${this.baseUrl}/scoreboard`);

    // ESPN uses 'dates' parameter - can be YYYY (year) or YYYYMMDD (specific date)
    if (params.date) {
      // Specific date: YYYYMMDD format
      const dateStr = params.date.toISOString().split('T')[0].replace(/-/g, '');
      url.searchParams.set('dates', dateStr);
    } else if (params.season) {
      // Year only: YYYY format
      url.searchParams.set('dates', String(params.season));
    }

    // ESPN uses 'week' and 'seasontype' parameters
    if (params.week !== undefined) {
      url.searchParams.set('week', String(params.week));
    }

    if (params.seasonType) {
      const seasonTypeMap = {
        preseason: '1',
        regular: '2',
        postseason: '3',
      };
      url.searchParams.set('seasontype', seasonTypeMap[params.seasonType]);
    }

    // Limit results (optional)
    url.searchParams.set('limit', '100');

    return url.toString();
  }

  /**
   * Get current live games
   */
  async getLiveGames(): Promise<Game[]> {
    const allGames = await this.getGames({ season: new Date().getFullYear() });
    return allGames.filter((game) => game.isLive);
  }

  /**
   * Get games for a specific week
   */
  async getWeekGames(
    season: number,
    week: number,
    seasonType: 'preseason' | 'regular' | 'postseason' = 'regular'
  ): Promise<Game[]> {
    return this.getGames({ season, week, seasonType });
  }

  /**
   * Get games for a specific date
   */
  async getGamesForDate(date: Date): Promise<Game[]> {
    return this.getGames({ season: date.getFullYear(), date });
  }
}
