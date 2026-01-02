/**
 * Football API Client
 *
 * Domain-specific API client for NFL Games SPA
 * Implements multi-tenant context via X-Community-ID header
 */

import type {
  ScoreboardResponse,
  ScheduleResponse,
  LiveGamesResponse,
  GameDetailsResponse,
  TeamGamesResponse,
  StandingsResponse,
  TeamDetailsResponse,
  NewsResponse,
  GameSummaryResponse,
  TeamStatisticsResponse,
} from '../types/api';

// Community context store - set by dashboard components
let currentCommunityId: string | undefined;

/**
 * Set the current community context for API calls
 * Called by dashboard components when mounted
 */
export function setCommunityContext(communityId: string | undefined) {
  currentCommunityId = communityId;
}

/**
 * Get the current community context
 */
export function getCommunityContext(): string | undefined {
  return currentCommunityId;
}

/**
 * Build headers with community context
 */
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (currentCommunityId) {
    headers['X-Community-ID'] = currentCommunityId;
  }

  return headers;
}

/**
 * Base fetch with retry logic and community context
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const baseUrl = typeof window !== 'undefined'
    ? (window as unknown as { ENV?: { API_URL?: string } }).ENV?.API_URL || ''
    : '';

  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...buildHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1000 * 2 ** attempt, 30000))
      );
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * API Client for Football API
 * All methods include community context via headers
 */
class FootballAPIClient {
  /**
   * Get scoreboard for a specific season and week
   */
  async getScoreboard(params: {
    season: number;
    week?: number;
    seasonType?: 'preseason' | 'regular' | 'postseason';
  }): Promise<ScoreboardResponse> {
    const searchParams = new URLSearchParams({
      season: String(params.season),
      ...(params.week && { week: String(params.week) }),
      ...(params.seasonType && { seasonType: params.seasonType }),
    });

    return fetchWithRetry<ScoreboardResponse>(
      `/api/v1/scoreboard?${searchParams.toString()}`
    );
  }

  /**
   * Get schedule (unplayed games) for a specific season and week
   */
  async getSchedule(params: {
    season: number;
    week?: number;
    seasonType?: 'preseason' | 'regular' | 'postseason';
  }): Promise<ScheduleResponse> {
    const searchParams = new URLSearchParams({
      season: String(params.season),
      ...(params.week && { week: String(params.week) }),
      ...(params.seasonType && { seasonType: params.seasonType }),
    });

    return fetchWithRetry<ScheduleResponse>(
      `/api/v1/schedule?${searchParams.toString()}`
    );
  }

  /**
   * Get all currently live games
   */
  async getLiveGames(): Promise<LiveGamesResponse> {
    return fetchWithRetry<LiveGamesResponse>('/api/v1/games/live');
  }

  /**
   * Get details for a specific game
   */
  async getGameDetails(gameId: string): Promise<GameDetailsResponse> {
    return fetchWithRetry<GameDetailsResponse>(`/api/v1/games/${gameId}`);
  }

  /**
   * Get game summary with box score, leaders, scoring plays, and drives
   */
  async getGameSummary(gameId: string): Promise<GameSummaryResponse> {
    return fetchWithRetry<GameSummaryResponse>(`/api/v1/games/${gameId}/summary`);
  }

  /**
   * Get all games for a specific team
   */
  async getTeamGames(teamId: string, season: number): Promise<TeamGamesResponse> {
    return fetchWithRetry<TeamGamesResponse>(
      `/api/v1/teams/${teamId}/games?season=${season}`
    );
  }

  /**
   * Get NFL standings
   */
  async getStandings(season?: number): Promise<StandingsResponse> {
    const params = season ? `?season=${season}` : '';
    return fetchWithRetry<StandingsResponse>(`/api/v1/standings${params}`);
  }

  /**
   * Get team details with roster
   */
  async getTeamDetails(teamId: string): Promise<TeamDetailsResponse> {
    return fetchWithRetry<TeamDetailsResponse>(`/api/v1/teams/${teamId}`);
  }

  /**
   * Get NFL news
   */
  async getNews(limit?: number): Promise<NewsResponse> {
    const params = limit ? `?limit=${limit}` : '';
    return fetchWithRetry<NewsResponse>(`/api/v1/news${params}`);
  }

  /**
   * Get team statistics
   */
  async getTeamStatistics(teamId: string): Promise<TeamStatisticsResponse> {
    return fetchWithRetry<TeamStatisticsResponse>(
      `/api/v1/teams/${teamId}/statistics`
    );
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return fetchWithRetry<{ status: string; timestamp: string; uptime: number }>(
      '/health'
    );
  }
}

export const apiClient = new FootballAPIClient();
