/**
 * Period Score Value Object
 * Represents a score for a single period/quarter
 */
export class PeriodScore {
  constructor(
    public readonly home: number,
    public readonly away: number
  ) {
    if (home < 0 || away < 0) {
      throw new Error('Scores cannot be negative');
    }
  }

  /**
   * Get the point differential for this period
   */
  get differential(): number {
    return this.home - this.away;
  }

  /**
   * Get the total points scored in this period
   */
  get total(): number {
    return this.home + this.away;
  }
}

/**
 * Score Value Object
 * Represents the complete score of a game including period-by-period breakdown
 */
export class Score {
  constructor(
    public readonly home: number,
    public readonly away: number,
    public readonly periods: PeriodScore[] = []
  ) {
    if (home < 0 || away < 0) {
      throw new Error('Scores cannot be negative');
    }

    // Validate that period scores add up to total (if periods are provided)
    if (periods.length > 0) {
      const periodHomeTotal = periods.reduce((sum, p) => sum + p.home, 0);
      const periodAwayTotal = periods.reduce((sum, p) => sum + p.away, 0);

      if (periodHomeTotal !== home || periodAwayTotal !== away) {
        throw new Error('Period scores do not match total scores');
      }
    }
  }

  /**
   * Get the point differential (spread)
   */
  get differential(): number {
    return this.home - this.away;
  }

  /**
   * Get the total points scored in the game
   */
  get total(): number {
    return this.home + this.away;
  }

  /**
   * Check if the home team is winning
   */
  get isHomeWinning(): boolean {
    return this.home > this.away;
  }

  /**
   * Check if the away team is winning
   */
  get isAwayWinning(): boolean {
    return this.away > this.home;
  }

  /**
   * Check if the game is tied
   */
  get isTied(): boolean {
    return this.home === this.away;
  }

  /**
   * Get the winning margin
   */
  get margin(): number {
    return Math.abs(this.differential);
  }

  /**
   * Check if the game is within one score (8 points in football)
   */
  get isOneScore(): boolean {
    return this.margin <= 8;
  }

  /**
   * Create a new Score with updated values
   */
  withScores(home: number, away: number, periods?: PeriodScore[]): Score {
    return new Score(home, away, periods || this.periods);
  }

  /**
   * Add a period score
   */
  addPeriod(periodScore: PeriodScore): Score {
    return new Score(this.home, this.away, [...this.periods, periodScore]);
  }

  /**
   * Get a specific period's score
   */
  getPeriod(index: number): PeriodScore | undefined {
    return this.periods[index];
  }

  /**
   * Convert to a plain object
   */
  toObject() {
    return {
      home: this.home,
      away: this.away,
      differential: this.differential,
      periods: this.periods.map((p) => ({
        home: p.home,
        away: p.away,
      })),
    };
  }
}
