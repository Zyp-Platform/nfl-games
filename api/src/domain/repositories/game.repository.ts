import type { Game } from '../entities/game.entity.js';
import type { GameStatus } from '../value-objects/game-status.js';

/**
 * Parameters for finding games by date range
 */
export interface DateRangeParams {
  start: Date;
  end: Date;
}

/**
 * Parameters for finding games by week
 */
export interface WeekParams {
  season: number;
  week: number;
  seasonType?: 'preseason' | 'regular' | 'postseason';
}

/**
 * Parameters for filtering games
 */
export interface GameFilterParams {
  season?: number;
  week?: number;
  seasonType?: 'preseason' | 'regular' | 'postseason';
  teamId?: string;
  status?: GameStatus | GameStatus[];
  date?: Date;
}

/**
 * Game Repository Interface
 * Defines the contract for accessing game data
 *
 * This is a domain interface - implementations belong in infrastructure layer
 */
export interface IGameRepository {
  /**
   * Find a game by its internal ID
   */
  findById(id: string): Promise<Game | null>;

  /**
   * Find a game by external provider ID
   */
  findByExternalId(provider: string, externalId: string): Promise<Game | null>;

  /**
   * Find games within a date range
   */
  findByDateRange(params: DateRangeParams): Promise<Game[]>;

  /**
   * Find games by season and week
   */
  findByWeek(params: WeekParams): Promise<Game[]>;

  /**
   * Find all currently live games
   */
  findLive(): Promise<Game[]>;

  /**
   * Find games matching filter criteria
   */
  findByFilter(params: GameFilterParams): Promise<Game[]>;

  /**
   * Save a game (create or update)
   */
  save(game: Game): Promise<Game>;

  /**
   * Save multiple games in a batch
   */
  saveMany(games: Game[]): Promise<Game[]>;

  /**
   * Delete a game
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a game exists
   */
  exists(id: string): Promise<boolean>;
}
