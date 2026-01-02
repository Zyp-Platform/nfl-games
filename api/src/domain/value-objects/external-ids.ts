/**
 * External IDs Value Object
 * Stores provider-specific IDs for cross-referencing games across different providers
 */
export class ExternalIds {
  private readonly ids: Map<string, string>;

  constructor(initialIds: Record<string, string> = {}) {
    this.ids = new Map(Object.entries(initialIds));
  }

  /**
   * Get the ID for a specific provider
   */
  get(provider: string): string | undefined {
    return this.ids.get(provider);
  }

  /**
   * Check if an ID exists for a provider
   */
  has(provider: string): boolean {
    return this.ids.has(provider);
  }

  /**
   * Create a new ExternalIds instance with an additional ID
   * (Maintains immutability)
   */
  with(provider: string, id: string): ExternalIds {
    const newIds = Object.fromEntries(this.ids);
    newIds[provider] = id;
    return new ExternalIds(newIds);
  }

  /**
   * Get all provider IDs as a plain object
   */
  toObject(): Record<string, string> {
    return Object.fromEntries(this.ids);
  }

  /**
   * Get all provider names
   */
  getProviders(): string[] {
    return Array.from(this.ids.keys());
  }

  /**
   * Get the ESPN ID if available
   */
  get espn(): string | undefined {
    return this.get('espn');
  }

  /**
   * Get the SportsRadar ID if available
   */
  get sportsRadar(): string | undefined {
    return this.get('sportsradar');
  }
}
