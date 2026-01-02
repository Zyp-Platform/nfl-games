/**
 * Rate Limiter Configuration
 */
export interface RateLimiterConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Token Bucket Rate Limiter
 * Implements the token bucket algorithm for rate limiting
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.maxRequests;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    // Calculate how many tokens to add per millisecond
    this.refillRate = config.maxRequests / config.windowMs;
  }

  /**
   * Attempt to acquire a token
   * Returns true if successful, false if rate limit exceeded
   */
  async tryAcquire(): Promise<boolean> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Acquire a token, waiting if necessary
   * Throws error if wait time exceeds timeout
   */
  async acquire(timeoutMs: number = 5000): Promise<void> {
    const startTime = Date.now();

    while (true) {
      if (await this.tryAcquire()) {
        return;
      }

      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeoutMs) {
        throw new Error('Rate limiter timeout: could not acquire token');
      }

      // Wait a bit before retrying (10% of refill time or 50ms, whichever is smaller)
      const waitTime = Math.min((1 / this.refillRate) * 0.1, 50);
      await this.sleep(waitTime);
    }
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current token count (for monitoring)
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
