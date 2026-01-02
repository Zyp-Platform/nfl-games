/**
 * Domain Event
 */
export interface DomainEvent<T = unknown> {
  eventName: string;
  occurredAt: Date;
  data: T;
}

/**
 * Event Handler
 */
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

/**
 * Event Bus Interface
 */
export interface IEventBus {
  /**
   * Emit an event
   */
  emit<T = unknown>(eventName: string, data: T): Promise<void>;

  /**
   * Subscribe to an event
   */
  on(eventName: string, handler: EventHandler): void;

  /**
   * Unsubscribe from an event
   */
  off(eventName: string, handler: EventHandler): void;

  /**
   * Subscribe to an event once
   */
  once(eventName: string, handler: EventHandler): void;
}

/**
 * Simple In-Memory Event Bus
 */
export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private onceHandlers = new Map<string, Set<EventHandler>>();

  async emit<T = unknown>(eventName: string, data: T): Promise<void> {
    const event: DomainEvent<T> = {
      eventName,
      occurredAt: new Date(),
      data,
    };

    // Regular handlers
    const regularHandlers = this.handlers.get(eventName);
    if (regularHandlers) {
      for (const handler of regularHandlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      }
    }

    // Once handlers
    const onceHandlers = this.onceHandlers.get(eventName);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in once handler for ${eventName}:`, error);
        }
      }
      // Clear once handlers after execution
      this.onceHandlers.delete(eventName);
    }
  }

  on(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
  }

  off(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  once(eventName: string, handler: EventHandler): void {
    if (!this.onceHandlers.has(eventName)) {
      this.onceHandlers.set(eventName, new Set());
    }
    this.onceHandlers.get(eventName)!.add(handler);
  }

  /**
   * Get subscriber count for an event
   */
  getSubscriberCount(eventName: string): number {
    const regular = this.handlers.get(eventName)?.size || 0;
    const once = this.onceHandlers.get(eventName)?.size || 0;
    return regular + once;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
  }
}
