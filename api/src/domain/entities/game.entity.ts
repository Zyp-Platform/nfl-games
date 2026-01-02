import type { ExternalIds } from '../value-objects/external-ids.js';
import type { GameStatus} from '../value-objects/game-status.js';
import { isLiveStatus, isCompletedStatus } from '../value-objects/game-status.js';
import type { Score } from '../value-objects/score.js';
import type { GameClock } from '../value-objects/game-clock.js';
import type { TeamReference } from './team.entity.js';
import type { Venue } from './venue.entity.js';

/**
 * Game Period Type
 */
export type GamePeriod = 1 | 2 | 3 | 4 | 'OT' | 'HALFTIME';

/**
 * Broadcast Information
 */
export interface Broadcast {
  network: string;
  market?: string;
}

/**
 * Weather Information
 */
export interface Weather {
  temperature?: number;
  conditions?: string;
  wind?: string;
  humidity?: number;
}

/**
 * Game Metadata
 */
export interface GameMetadata {
  season: number;
  seasonType: 'preseason' | 'regular' | 'postseason';
  week?: number;
  attendance?: number;
  lastModified: Date;
}

/**
 * Game Entity
 * Core domain entity representing a football game
 */
export class Game {
  constructor(
    public readonly id: string,
    public readonly externalIds: ExternalIds,
    public readonly homeTeam: TeamReference,
    public readonly awayTeam: TeamReference,
    public readonly status: GameStatus,
    public readonly score: Score,
    public readonly scheduledAt: Date,
    public readonly metadata: GameMetadata,
    public readonly venue?: Venue,
    public readonly period?: GamePeriod,
    public readonly clock?: GameClock,
    public readonly weather?: Weather,
    public readonly broadcasts: Broadcast[] = []
  ) {
    if (!id || !externalIds || !homeTeam || !awayTeam) {
      throw new Error('Game must have id, externalIds, homeTeam, and awayTeam');
    }
    if (!scheduledAt || !(scheduledAt instanceof Date)) {
      throw new Error('scheduledAt must be a valid Date');
    }
  }

  /**
   * Check if the game is currently live
   */
  get isLive(): boolean {
    return isLiveStatus(this.status);
  }

  /**
   * Check if the game is completed
   */
  get isCompleted(): boolean {
    return isCompletedStatus(this.status);
  }

  /**
   * Check if it's a clutch-time situation
   * (4th quarter or OT, under 2 minutes, within one score)
   */
  get isClutchTime(): boolean {
    if (!this.isLive) return false;
    if (!this.period || !this.clock) return false;

    const isFinalPeriod = this.period === 4 || this.period === 'OT';
    const isUnderTwoMinutes = this.clock.isTwoMinuteWarning;
    const isClose = this.score.isOneScore;

    return isFinalPeriod && isUnderTwoMinutes && isClose;
  }

  /**
   * Get the winning team (or undefined if tied/not started)
   */
  get winningTeam(): TeamReference | undefined {
    if (this.score.isHomeWinning) return this.homeTeam;
    if (this.score.isAwayWinning) return this.awayTeam;
    return undefined;
  }

  /**
   * Get the losing team (or undefined if tied/not started)
   */
  get losingTeam(): TeamReference | undefined {
    if (this.score.isHomeWinning) return this.awayTeam;
    if (this.score.isAwayWinning) return this.homeTeam;
    return undefined;
  }

  /**
   * Get game title (Away @ Home)
   */
  get title(): string {
    return `${this.awayTeam.displayName} @ ${this.homeTeam.displayName}`;
  }

  /**
   * Get short game title (AWAY @ HOME)
   */
  get shortTitle(): string {
    return `${this.awayTeam.abbreviation} @ ${this.homeTeam.abbreviation}`;
  }

  /**
   * Create a new Game with updated score
   */
  withScore(score: Score): Game {
    return new Game(
      this.id,
      this.externalIds,
      this.homeTeam,
      this.awayTeam,
      this.status,
      score,
      this.scheduledAt,
      this.metadata,
      this.venue,
      this.period,
      this.clock,
      this.weather,
      this.broadcasts
    );
  }

  /**
   * Create a new Game with updated status
   */
  withStatus(status: GameStatus): Game {
    return new Game(
      this.id,
      this.externalIds,
      this.homeTeam,
      this.awayTeam,
      status,
      this.score,
      this.scheduledAt,
      this.metadata,
      this.venue,
      this.period,
      this.clock,
      this.weather,
      this.broadcasts
    );
  }

  /**
   * Create a new Game with updated clock
   */
  withClock(period: GamePeriod, clock: GameClock): Game {
    return new Game(
      this.id,
      this.externalIds,
      this.homeTeam,
      this.awayTeam,
      this.status,
      this.score,
      this.scheduledAt,
      this.metadata,
      this.venue,
      period,
      clock,
      this.weather,
      this.broadcasts
    );
  }

  /**
   * Check if significant change occurred (for real-time updates)
   */
  hasSignificantChangeSince(other: Game): boolean {
    // Score changed
    if (this.score.home !== other.score.home || this.score.away !== other.score.away) {
      return true;
    }

    // Status changed
    if (this.status !== other.status) {
      return true;
    }

    // Period changed
    if (this.period !== other.period) {
      return true;
    }

    // Clock changed significantly (more than 5 seconds)
    if (this.clock && other.clock) {
      const timeDiff = Math.abs(this.clock.totalSeconds - other.clock.totalSeconds);
      if (timeDiff > 5) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      externalIds: this.externalIds.toObject(),
      homeTeam: this.homeTeam.toObject(),
      awayTeam: this.awayTeam.toObject(),
      status: this.status,
      score: this.score.toObject(),
      scheduledAt: this.scheduledAt.toISOString(),
      metadata: {
        ...this.metadata,
        lastModified: this.metadata.lastModified.toISOString(),
      },
      venue: this.venue?.toObject(),
      period: this.period,
      clock: this.clock?.display,
      weather: this.weather,
      broadcasts: this.broadcasts,
      // Computed properties
      isLive: this.isLive,
      isCompleted: this.isCompleted,
      isClutchTime: this.isClutchTime,
      title: this.title,
      shortTitle: this.shortTitle,
    };
  }
}
