/**
 * Team Reference Value Object
 * Minimal team information for game context
 */
export class TeamReference {
  constructor(
    public readonly id: string,
    public readonly abbreviation: string,
    public readonly displayName: string,
    public readonly location?: string,
    public readonly nickname?: string,
    public readonly color?: string,
    public readonly logo?: string
  ) {
    if (!id || !abbreviation || !displayName) {
      throw new Error('Team must have id, abbreviation, and displayName');
    }
  }

  /**
   * Get full team name (location + nickname)
   */
  get fullName(): string {
    if (this.location && this.nickname) {
      return `${this.location} ${this.nickname}`;
    }
    return this.displayName;
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      abbreviation: this.abbreviation,
      displayName: this.displayName,
      location: this.location,
      nickname: this.nickname,
      color: this.color,
      logo: this.logo,
    };
  }
}
