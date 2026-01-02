import { describe, it, expect } from 'vitest';
import { createServer } from './server.js';

describe('Server', () => {
  describe('createServer', () => {
    it('should create a Fastify server instance', async () => {
      const server = await createServer();
      expect(server).toBeDefined();
      expect(server.listen).toBeDefined();
      await server.close();
    });

    it('should register health check endpoint', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
      expect(body.uptime).toBeGreaterThanOrEqual(0);

      await server.close();
    });

    it('should return valid JSON from health endpoint', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['content-type']).toContain('application/json');
      expect(() => JSON.parse(response.body)).not.toThrow();

      await server.close();
    });

    it('should include timestamp in ISO format', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      await server.close();
    });

    it('should include uptime in seconds', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThanOrEqual(0);

      await server.close();
    });
  });

  describe('CORS', () => {
    it('should enable CORS', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'OPTIONS',
        url: '/health',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'GET',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();

      await server.close();
    });
  });

  describe('Request ID', () => {
    it('should add request ID to response headers', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');

      await server.close();
    });

    it('should use provided request ID if present', async () => {
      const server = await createServer();
      const customRequestId = 'custom-request-id-123';

      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': customRequestId,
        },
      });

      expect(response.headers['x-request-id']).toBe(customRequestId);

      await server.close();
    });
  });

  describe('Routes registration', () => {
    it('should register games routes', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/games/live',
      });

      // Should not be 404 (route exists)
      expect(response.statusCode).not.toBe(404);

      await server.close();
    });

    it('should register scoreboard routes', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/scoreboard?season=2024&week=1',
      });

      // Should not be 404 (route exists)
      expect(response.statusCode).not.toBe(404);

      await server.close();
    });

    it('should register schedule routes', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/schedule?season=2024&week=1',
      });

      // Should not be 404 (route exists)
      expect(response.statusCode).not.toBe(404);

      await server.close();
    });
  });

  describe('Swagger/OpenAPI', () => {
    it('should serve Swagger documentation', async () => {
      const server = await createServer();

      const response = await server.inject({
        method: 'GET',
        url: '/docs',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');

      await server.close();
    });
  });
});
