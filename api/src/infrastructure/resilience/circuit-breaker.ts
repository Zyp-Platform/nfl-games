/**
 * Circuit Breaker State
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  /** Failure threshold percentage (0-100) to open circuit */
  failureThreshold: number;
  /** Minimum number of requests before calculating failure rate */
  minimumRequests: number;
  /** Time in ms to wait before attempting to close circuit */
  resetTimeout: number;
  /** Number of successful requests needed in half-open to close circuit */
  successThreshold?: number;
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker
 * Implements the circuit breaker pattern for fault tolerance
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private requestCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  constructor(private config: CircuitBreakerConfig) {
    // Validate config
    if (config.failureThreshold < 0 || config.failureThreshold > 100) {
      throw new Error('Failure threshold must be between 0 and 100');
    }
  }

  /**
   * Check if a request is allowed
   */
  allowRequest(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to try again
      if (Date.now() >= this.nextAttemptTime) {
        this.transitionToHalfOpen();
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow request to test if service recovered
    return true;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.requestCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      const successThreshold = this.config.successThreshold || 1;
      if (this.successCount >= successThreshold) {
        this.transitionToClosed();
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.failureCount++;
    this.requestCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.transitionToOpen();
      return;
    }

    // Check if we should open the circuit
    if (this.requestCount >= this.config.minimumRequests) {
      const failureRate = (this.failureCount / this.requestCount) * 100;

      if (failureRate >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      failureRate: this.requestCount > 0 ? (this.failureCount / this.requestCount) * 100 : 0,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.transitionToClosed();
  }

  /**
   * Force a specific state (for testing)
   */
  forceState(state: CircuitState): void {
    this.state = state;
  }
}
