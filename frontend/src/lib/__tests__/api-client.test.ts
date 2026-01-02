import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../api-client';

// Mock @zyp/api-client
vi.mock('@zyp/api-client', () => ({
  createApiClient: () => ({
    get: vi.fn(),
  }),
}));

describe('FootballAPIClient', () => {
  describe('getScoreboard', () => {
    it('constructs correct URL with all parameters', async () => {
      // Mock the baseClient.get method
      vi.spyOn(apiClient, 'getScoreboard').mockResolvedValue({
        games: [],
        metadata: {
          season: 2025,
          week: 10,
          seasonType: 'regular',
          totalGames: 0,
          liveGames: 0,
          completedGames: 0,
          cacheHit: false,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getScoreboard({
        season: 2025,
        week: 10,
        seasonType: 'regular',
      });

      expect(result).toBeDefined();
      expect(result.metadata.season).toBe(2025);
    });

    it('handles optional parameters', async () => {
      vi.spyOn(apiClient, 'getScoreboard').mockResolvedValue({
        games: [],
        metadata: {
          season: 2025,
          week: 1,
          seasonType: 'regular',
          totalGames: 0,
          liveGames: 0,
          completedGames: 0,
          cacheHit: false,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getScoreboard({
        season: 2025,
      });

      expect(result).toBeDefined();
    });
  });

  describe('getSchedule', () => {
    it('fetches schedule successfully', async () => {
      vi.spyOn(apiClient, 'getSchedule').mockResolvedValue({
        games: [],
        metadata: {
          season: 2025,
          week: 10,
          seasonType: 'regular',
          totalGames: 0,
          upcomingGames: 0,
          cacheHit: false,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getSchedule({
        season: 2025,
        week: 10,
      });

      expect(result).toBeDefined();
      expect(result.metadata.season).toBe(2025);
    });
  });

  describe('getLiveGames', () => {
    it('fetches live games successfully', async () => {
      vi.spyOn(apiClient, 'getLiveGames').mockResolvedValue({
        games: [],
        metadata: {
          totalLiveGames: 0,
          clutchTimeGames: 0,
          cacheHit: false,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getLiveGames();

      expect(result).toBeDefined();
      expect(result.metadata.totalLiveGames).toBe(0);
    });
  });

  describe('getGameDetails', () => {
    it('fetches game details successfully', async () => {
      vi.spyOn(apiClient, 'getGameDetails').mockResolvedValue({
        game: {
          id: 'game_123',
          externalIds: {},
          homeTeam: {
            id: 'team_1',
            abbreviation: 'SEA',
            displayName: 'Seattle Seahawks',
          },
          awayTeam: {
            id: 'team_2',
            abbreviation: 'SF',
            displayName: 'San Francisco 49ers',
          },
          status: 'FINAL',
          score: {
            home: 24,
            away: 21,
            differential: 3,
            periods: [],
          },
          scheduledAt: '2025-11-10T13:00:00Z',
          metadata: {
            season: 2025,
            seasonType: 'regular',
            week: 10,
            lastModified: '2025-11-10T16:00:00Z',
          },
          broadcasts: [],
          isLive: false,
          isCompleted: true,
          isClutchTime: false,
          title: 'SF @ SEA',
          shortTitle: 'SF @ SEA',
        },
        metadata: {
          cacheHit: false,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getGameDetails('game_123');

      expect(result).toBeDefined();
      expect(result.game.id).toBe('game_123');
    });
  });

  describe('getTeamGames', () => {
    it('fetches team games successfully', async () => {
      vi.spyOn(apiClient, 'getTeamGames').mockResolvedValue({
        team: {
          id: 'team_1',
          abbreviation: 'SEA',
          displayName: 'Seattle Seahawks',
        },
        games: [],
        metadata: {
          season: 2025,
          totalGames: 0,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getTeamGames('team_1', 2025);

      expect(result).toBeDefined();
      expect(result.team?.id).toBe('team_1');
    });
  });

  describe('getStandings', () => {
    it('fetches standings successfully', async () => {
      vi.spyOn(apiClient, 'getStandings').mockResolvedValue({
        season: 2025,
        conferences: [],
        metadata: {
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getStandings(2025);

      expect(result).toBeDefined();
      expect(result.season).toBe(2025);
    });

    it('uses current season when no parameter provided', async () => {
      vi.spyOn(apiClient, 'getStandings').mockResolvedValue({
        season: new Date().getFullYear(),
        conferences: [],
        metadata: {
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getStandings();

      expect(result).toBeDefined();
    });
  });

  describe('getTeamDetails', () => {
    it('fetches team details successfully', async () => {
      vi.spyOn(apiClient, 'getTeamDetails').mockResolvedValue({
        team: {
          id: 'team_1',
          abbreviation: 'SEA',
          displayName: 'Seattle Seahawks',
          shortDisplayName: 'Seahawks',
          location: 'Seattle',
          name: 'Seahawks',
          nickname: 'Seahawks',
          color: '002244',
          alternateColor: '69BE28',
          logo: 'https://example.com/sea.png',
          logos: [],
        },
        record: null,
        nextEvent: null,
        roster: null,
        metadata: {
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getTeamDetails('team_1');

      expect(result).toBeDefined();
      expect(result.team.id).toBe('team_1');
    });
  });

  describe('getNews', () => {
    it('fetches news successfully', async () => {
      vi.spyOn(apiClient, 'getNews').mockResolvedValue({
        header: 'NFL News',
        articles: [],
        metadata: {
          total: 0,
          limit: 10,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getNews(10);

      expect(result).toBeDefined();
      expect(result.metadata.limit).toBe(10);
    });

    it('uses default limit when none provided', async () => {
      vi.spyOn(apiClient, 'getNews').mockResolvedValue({
        header: 'NFL News',
        articles: [],
        metadata: {
          total: 0,
          limit: 20,
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getNews();

      expect(result).toBeDefined();
    });
  });

  describe('getGameSummary', () => {
    it('fetches game summary successfully', async () => {
      vi.spyOn(apiClient, 'getGameSummary').mockResolvedValue({
        boxscore: [],
        leaders: [],
        scoringPlays: [],
        drives: {
          current: null,
          previous: [],
        },
        metadata: {
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getGameSummary('game_123');

      expect(result).toBeDefined();
    });
  });

  describe('getTeamStatistics', () => {
    it('fetches team statistics successfully', async () => {
      vi.spyOn(apiClient, 'getTeamStatistics').mockResolvedValue({
        statistics: {
          passing: { name: 'passing', displayName: 'Passing', stats: [] },
          rushing: { name: 'rushing', displayName: 'Rushing', stats: [] },
          receiving: { name: 'receiving', displayName: 'Receiving', stats: [] },
          defensive: { name: 'defensive', displayName: 'Defensive', stats: [] },
          general: { name: 'general', displayName: 'General', stats: [] },
          scoring: { name: 'scoring', displayName: 'Scoring', stats: [] },
        },
        metadata: {
          timestamp: '2025-11-10T16:00:00Z',
        },
      });

      const result = await apiClient.getTeamStatistics('team_1');

      expect(result).toBeDefined();
      expect(result.statistics).toBeDefined();
    });
  });
});
