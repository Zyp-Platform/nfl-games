/**
 * Game Clock Value Object
 * Represents the time remaining in the current period
 */
export class GameClock {
  constructor(
    public readonly minutes: number,
    public readonly seconds: number
  ) {
    if (minutes < 0 || minutes > 15) {
      throw new Error('Minutes must be between 0 and 15');
    }
    if (seconds < 0 || seconds > 59) {
      throw new Error('Seconds must be between 0 and 59');
    }
  }

  /**
   * Get total seconds remaining
   */
  get totalSeconds(): number {
    return this.minutes * 60 + this.seconds;
  }

  /**
   * Get clock display string (MM:SS)
   */
  get display(): string {
    const mins = this.minutes.toString().padStart(2, '0');
    const secs = this.seconds.toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  /**
   * Check if clock is under 2 minutes
   */
  get isTwoMinuteWarning(): boolean {
    return this.totalSeconds <= 120;
  }

  /**
   * Check if clock is expired
   */
  get isExpired(): boolean {
    return this.totalSeconds === 0;
  }

  /**
   * Create from total seconds
   */
  static fromSeconds(totalSeconds: number): GameClock {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return new GameClock(minutes, seconds);
  }

  /**
   * Create from display string (MM:SS)
   */
  static fromDisplay(display: string): GameClock {
    const [minutes, seconds] = display.split(':').map(Number);
    return new GameClock(minutes, seconds);
  }
}
