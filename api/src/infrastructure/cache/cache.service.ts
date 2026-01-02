/**
 * Cache Service Interface
 * Abstraction for caching layer (in-memory, Redis, etc.)
 */
export interface ICacheService {
  /**
   * Get value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

  /**
   * Delete value from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all cache
   */
  clear(): Promise<void>;
}

/**
 * In-Memory Cache Service
 * Simple implementation using Map with TTL
 */
export class InMemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
      cachedAt: Date.now(),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  cachedAt: number;
}
