import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DomainEvent } from './event-bus.js';
import { InMemoryEventBus } from './event-bus.js';

describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });

  describe('emit and on', () => {
    it('should emit events to subscribed handlers', async () => {
      const handler = vi.fn();
      eventBus.on('test.event', handler);

      await eventBus.emit('test.event', { message: 'hello' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'test.event',
          data: { message: 'hello' },
          occurredAt: expect.any(Date),
        })
      );
    });

    it('should support multiple handlers for the same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.on('test.event', handler1);
      eventBus.on('test.event', handler2);
      eventBus.on('test.event', handler3);

      await eventBus.emit('test.event', { count: 42 });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should only notify handlers for the emitted event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('event.one', handler1);
      eventBus.on('event.two', handler2);

      await eventBus.emit('event.one', {});

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle async handlers', async () => {
      let asyncValue = '';
      const asyncHandler = async (event: DomainEvent) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        asyncValue = event.data.value;
      };

      eventBus.on('async.event', asyncHandler);
      await eventBus.emit('async.event', { value: 'async result' });

      expect(asyncValue).toBe('async result');
    });

    it('should not throw if no handlers are registered', async () => {
      await expect(eventBus.emit('unhandled.event', {})).resolves.not.toThrow();
    });
  });

  describe('once', () => {
    it('should call once handler only on first emit', async () => {
      const handler = vi.fn();
      eventBus.once('once.event', handler);

      await eventBus.emit('once.event', { count: 1 });
      await eventBus.emit('once.event', { count: 2 });
      await eventBus.emit('once.event', { count: 3 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { count: 1 },
        })
      );
    });

    it('should support multiple once handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.once('once.event', handler1);
      eventBus.once('once.event', handler2);

      await eventBus.emit('once.event', {});
      await eventBus.emit('once.event', {});

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should work with both on and once handlers', async () => {
      const onHandler = vi.fn();
      const onceHandler = vi.fn();

      eventBus.on('mixed.event', onHandler);
      eventBus.once('mixed.event', onceHandler);

      await eventBus.emit('mixed.event', {});
      await eventBus.emit('mixed.event', {});

      expect(onHandler).toHaveBeenCalledTimes(2);
      expect(onceHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    it('should unsubscribe a handler', async () => {
      const handler = vi.fn();
      eventBus.on('test.event', handler);

      await eventBus.emit('test.event', {});
      expect(handler).toHaveBeenCalledTimes(1);

      eventBus.off('test.event', handler);
      await eventBus.emit('test.event', {});
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should only remove the specified handler', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('test.event', handler1);
      eventBus.on('test.event', handler2);

      eventBus.off('test.event', handler1);

      await eventBus.emit('test.event', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not throw when removing non-existent handler', () => {
      const handler = vi.fn();
      expect(() => eventBus.off('test.event', handler)).not.toThrow();
    });
  });

  describe('getSubscriberCount', () => {
    it('should return the correct count of subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      expect(eventBus.getSubscriberCount('test.event')).toBe(0);

      eventBus.on('test.event', handler1);
      expect(eventBus.getSubscriberCount('test.event')).toBe(1);

      eventBus.on('test.event', handler2);
      expect(eventBus.getSubscriberCount('test.event')).toBe(2);

      eventBus.once('test.event', handler3);
      expect(eventBus.getSubscriberCount('test.event')).toBe(3);
    });

    it('should update count after unsubscribe', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('test.event', handler1);
      eventBus.on('test.event', handler2);
      expect(eventBus.getSubscriberCount('test.event')).toBe(2);

      eventBus.off('test.event', handler1);
      expect(eventBus.getSubscriberCount('test.event')).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.on('event.one', handler1);
      eventBus.on('event.two', handler2);
      eventBus.once('event.three', handler3);

      eventBus.clear();

      await eventBus.emit('event.one', {});
      await eventBus.emit('event.two', {});
      await eventBus.emit('event.three', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch and log handler errors without stopping other handlers', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = vi.fn();

      eventBus.on('test.event', errorHandler);
      eventBus.on('test.event', successHandler);

      await eventBus.emit('test.event', {});

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(successHandler).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should catch errors in once handlers', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorHandler = vi.fn().mockRejectedValue(new Error('Once handler error'));
      eventBus.once('test.event', errorHandler);

      await eventBus.emit('test.event', {});

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('complex scenarios', () => {
    it('should handle domain events with rich data', async () => {
      let receivedEvent: DomainEvent | null = null;

      eventBus.on('game.scored', (event) => {
        receivedEvent = event;
      });

      const gameData = {
        gameId: 'game-123',
        homeScore: 14,
        awayScore: 7,
        quarter: 2,
        timeRemaining: '5:23',
      };

      await eventBus.emit('game.scored', gameData);

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent?.eventName).toBe('game.scored');
      expect(receivedEvent?.data).toEqual(gameData);
      expect(receivedEvent?.occurredAt).toBeInstanceOf(Date);
    });

    it('should support event-driven workflows', async () => {
      const workflow: string[] = [];

      eventBus.on('workflow.start', async () => {
        workflow.push('started');
        await eventBus.emit('workflow.step1', {});
      });

      eventBus.on('workflow.step1', async () => {
        workflow.push('step1');
        await eventBus.emit('workflow.step2', {});
      });

      eventBus.on('workflow.step2', async () => {
        workflow.push('step2');
        await eventBus.emit('workflow.complete', {});
      });

      eventBus.on('workflow.complete', () => {
        workflow.push('completed');
      });

      await eventBus.emit('workflow.start', {});

      expect(workflow).toEqual(['started', 'step1', 'step2', 'completed']);
    });
  });
});
