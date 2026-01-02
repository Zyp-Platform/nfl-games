/**
 * Venue Entity
 * Represents the stadium/location where a game is played
 */
export class Venue {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly city: string,
    public readonly state?: string,
    public readonly capacity?: number,
    public readonly surface?: string,
    public readonly indoor?: boolean
  ) {
    if (!id || !name || !city) {
      throw new Error('Venue must have id, name, and city');
    }
  }

  /**
   * Get full venue location string
   */
  get location(): string {
    return this.state ? `${this.city}, ${this.state}` : this.city;
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      city: this.city,
      state: this.state,
      capacity: this.capacity,
      surface: this.surface,
      indoor: this.indoor,
    };
  }
}
