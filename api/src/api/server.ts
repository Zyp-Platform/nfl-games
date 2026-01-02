import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { responseHelpers, appAuth, errorHandler } from '@zyp/fastify-plugins';
import { createContainer } from './container.js';
import { scoreboardRoutes } from './routes/scoreboard.routes.js';
import { gamesRoutes } from './routes/games.routes.js';
import { scheduleRoutes } from './routes/schedule.routes.js';

/**
 * Create and configure Fastify server
 */
export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    // Custom schema error formatter
    schemaErrorFormatter: (_errors, _dataVar) => {
      return new Error('Invalid query parameters');
    },
  });

  // Register Swagger/OpenAPI
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Football API',
        description: 'NFL game data API with Hexagonal Architecture and DDD patterns',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://98.89.98.13',
          description: 'Production server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'scoreboard', description: 'Scoreboard endpoints' },
        { name: 'games', description: 'Game endpoints' },
        { name: 'schedule', description: 'Schedule endpoints' },
        { name: 'health', description: 'Health check endpoints' },
      ],
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: false, // Disable CSP for Swagger UI to work properly
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Register response helpers (MUST be before errorHandler)
  await fastify.register(responseHelpers);

  // Register global error handler (MUST be after responseHelpers)
  await fastify.register(errorHandler);

  // Register app authentication
  await fastify.register(appAuth);

  // Add request ID to response headers
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  // Create dependency injection container
  const container = createContainer();

  // Add container to request context
  fastify.decorate('container', container);

  // Register routes
  await fastify.register(scoreboardRoutes, { prefix: '/api/v1' });
  await fastify.register(gamesRoutes, { prefix: '/api/v1' });
  await fastify.register(scheduleRoutes, { prefix: '/api/v1' });

  // Import and register teams routes
  const { teamsRoutes } = await import('./routes/teams.routes.js');
  await fastify.register(teamsRoutes, { prefix: '/api/v1' });

  // Import and register standings routes
  const { standingsRoutes } = await import('./routes/standings.routes.js');
  await fastify.register(standingsRoutes, { prefix: '/api/v1' });

  // Import and register team details routes
  const { teamDetailsRoutes } = await import('./routes/team-details.routes.js');
  await fastify.register(teamDetailsRoutes, { prefix: '/api/v1' });

  // Import and register news routes
  const { newsRoutes } = await import('./routes/news.routes.js');
  await fastify.register(newsRoutes, { prefix: '/api/v1' });

  // Health check endpoint
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Health check',
        description: 'Check API health status and uptime',
        response: {
          200: {
            description: 'API is healthy',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    }
  );

  return fastify;
}

/**
 * Start the server
 */
async function start() {
  try {
    const server = await createServer();
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    console.log(`
🚀 Server ready at http://${host}:${port}
📊 Health check: http://${host}:${port}/health
📚 API Documentation: http://${host}:${port}/docs
📈 API endpoints:
   - GET /api/v1/scoreboard?season=2024&week=1
   - GET /api/v1/schedule?season=2024&week=1
   - GET /api/v1/games/live
   - GET /api/v1/games/:id
`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
