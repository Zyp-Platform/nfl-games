/**
 * Provider-specific game data (before transformation to domain model)
 */
export interface ProviderGame {
  externalId: string;
  [key: string]: unknown; // Provider-specific fields
}

/**
 * Parameters for fetching games
 */
export interface GetGamesParams {
  week?: number;
  season: number;
  seasonType?: 'preseason' | 'regular' | 'postseason';
  date?: Date;
}

/**
 * Provider Error
 */
export class ProviderError extends Error {
  constructor(
    public readonly providerName: string,
    public readonly operation: string,
    public readonly originalError: Error
  ) {
    super(`Provider ${providerName} error in ${operation}: ${originalError.message}`);
    this.name = 'ProviderError';
  }
}

/**
 * Provider Unavailable Error (circuit open or rate limited)
 */
export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}
