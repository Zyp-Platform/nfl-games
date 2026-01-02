import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '@zyp/fastify-plugins';

/**
 * Query parameter schema for news endpoint
 */
const newsQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

/**
 * News routes
 */
export async function newsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/news
   * Get latest NFL news articles
   */
  fastify.get(
    '/news',
    {
      schema: {
        tags: ['news'],
        summary: 'Get NFL news',
        description: 'Retrieve latest NFL news articles and updates',
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of articles to return (default: 20)',
              minimum: 1,
              maximum: 50,
            },
          },
        },
        response: {
          200: {
            description: 'Successful response with news articles',
            type: 'object',
            additionalProperties: true,
          },
          400: {
            description: 'Invalid parameters',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (request, reply) => {
      const validation = newsQuerySchema.safeParse(request.query);
      if (!validation.success) {
        throw new ValidationError('Invalid query parameters', validation.error);
      }
      const { limit } = validation.data;

      // Fetch from ESPN API
      const response = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

        interface NewsArticle {
          id: string;
          headline: string;
          description?: string;
          type: string;
          published: string;
          lastModified?: string;
          premium?: boolean;
          images?: Array<{
            url: string;
            width?: number;
            height?: number;
            caption?: string;
            alt?: string;
          }>;
          links?: {
            web?: { href: string };
            api?: { self?: { href: string } };
          };
          categories?: Array<{
            id: string;
            type: string;
            description: string;
            team?: {
              id: string;
              abbreviation: string;
              displayName: string;
            };
            athlete?: {
              id: string;
              displayName: string;
            };
          }>;
        }

        interface NewsResponse {
          header?: string;
          articles?: NewsArticle[];
        }

        const data = (await response.json()) as NewsResponse;
        const rawArticles: NewsArticle[] = data.articles || [];
        const articles = rawArticles.slice(0, limit).map((article) => ({
          id: article.id,
          headline: article.headline,
          description: article.description,
          type: article.type,
          published: article.published,
          lastModified: article.lastModified,
          premium: article.premium || false,
          images:
            article.images?.map((img) => ({
              url: img.url,
              width: img.width,
              height: img.height,
              caption: img.caption,
              alt: img.alt,
            })) || [],
          links: {
            web: article.links?.web?.href,
            api: article.links?.api?.self?.href,
          },
          categories:
            article.categories?.map((cat) => ({
              id: cat.id,
              type: cat.type,
              description: cat.description,
              team: cat.team
                ? {
                    id: cat.team.id,
                    abbreviation: cat.team.abbreviation,
                    displayName: cat.team.displayName,
                  }
                : null,
              athlete: cat.athlete
                ? {
                    id: cat.athlete.id,
                    displayName: cat.athlete.displayName,
                  }
                : null,
            })) || [],
        }));

        return reply.success({
          header: data.header,
          articles,
          metadata: {
            total: articles.length,
            limit,
            timestamp: new Date().toISOString(),
          },
        });
    }
  );
}
