import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryCacheService } from './cache.service.js';

describe('InMemoryCacheService', () => {
  let cacheService: InMemoryCacheService;

  beforeEach(() => {
    cacheService = new InMemoryCacheService(100); // Short cleanup interval for tests
  });

  afterEach(() => {
    cacheService.destroy();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', async () => {
      await cacheService.set('test-key', 'test-value', 60);
      const value = await cacheService.get<string>('test-key');
      expect(value).toBe('test-value');
    });

    it('should store and retrieve complex objects', async () => {
      const testObject = { name: 'test', count: 42, nested: { value: true } };
      await cacheService.set('test-object', testObject, 60);
      const value = await cacheService.get<typeof testObject>('test-object');
      expect(value).toEqual(testObject);
    });

    it('should return null for non-existent keys', async () => {
      const value = await cacheService.get('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should return null after TTL expires', async () => {
      await cacheService.set('short-ttl', 'value', 0.1); // 100ms TTL

      // Should exist immediately
      let value = await cacheService.get('short-ttl');
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be null after expiration
      value = await cacheService.get('short-ttl');
      expect(value).toBeNull();
    });

    it('should not expire before TTL', async () => {
      await cacheService.set('long-ttl', 'value', 10); // 10 second TTL

      // Wait a bit but not enough to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const value = await cacheService.get('long-ttl');
      expect(value).toBe('value');
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      await cacheService.set('delete-me', 'value', 60);
      expect(await cacheService.get('delete-me')).toBe('value');

      await cacheService.delete('delete-me');
      expect(await cacheService.get('delete-me')).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(cacheService.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      await cacheService.set('exists', 'value', 60);
      expect(await cacheService.has('exists')).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      expect(await cacheService.has('non-existent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      await cacheService.set('expired', 'value', 0.05); // 50ms TTL
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(await cacheService.has('expired')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key2', 'value2', 60);
      await cacheService.set('key3', 'value3', 60);

      expect(await cacheService.has('key1')).toBe(true);
      expect(await cacheService.has('key2')).toBe(true);
      expect(await cacheService.has('key3')).toBe(true);

      await cacheService.clear();

      expect(await cacheService.has('key1')).toBe(false);
      expect(await cacheService.has('key2')).toBe(false);
      expect(await cacheService.has('key3')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key2', 'value2', 60);

      const stats = cacheService.getStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should reflect size changes', async () => {
      expect(cacheService.getStats().size).toBe(0);

      await cacheService.set('key1', 'value1', 60);
      expect(cacheService.getStats().size).toBe(1);

      await cacheService.delete('key1');
      expect(cacheService.getStats().size).toBe(0);
    });
  });

  describe('automatic cleanup', () => {
    it('should automatically cleanup expired entries', async () => {
      const shortCleanupCache = new InMemoryCacheService(50); // 50ms cleanup interval

      await shortCleanupCache.set('expired1', 'value1', 0.02); // 20ms TTL
      await shortCleanupCache.set('expired2', 'value2', 0.02); // 20ms TTL
      await shortCleanupCache.set('long-lived', 'value3', 10); // 10s TTL

      // Wait for entries to expire and cleanup to run
      await new Promise((resolve) => setTimeout(resolve, 150));

      const stats = shortCleanupCache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toContain('long-lived');
      expect(stats.keys).not.toContain('expired1');
      expect(stats.keys).not.toContain('expired2');

      shortCleanupCache.destroy();
    });
  });

  describe('overwrite existing keys', () => {
    it('should overwrite existing keys', async () => {
      await cacheService.set('key', 'value1', 60);
      expect(await cacheService.get('key')).toBe('value1');

      await cacheService.set('key', 'value2', 60);
      expect(await cacheService.get('key')).toBe('value2');
    });

    it('should update TTL when overwriting', async () => {
      await cacheService.set('key', 'value1', 0.05); // 50ms TTL
      await new Promise((resolve) => setTimeout(resolve, 30));

      // Overwrite with longer TTL
      await cacheService.set('key', 'value2', 10); // 10s TTL
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still exist due to new TTL
      expect(await cacheService.get('key')).toBe('value2');
    });
  });
});
