import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from './api-client';
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

/**
 * React Query hooks for Football API
 */

export function useScoreboard(params: {
  season: number;
  week?: number;
  seasonType?: 'preseason' | 'regular' | 'postseason';
}): UseQueryResult<ScoreboardResponse, Error> {
  return useQuery({
    queryKey: ['scoreboard', params.season, params.week, params.seasonType],
    queryFn: () => apiClient.getScoreboard(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      // Don't refetch when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      // Refetch more frequently if there are live games
      const data = query.state.data;
      if (data?.metadata.liveGames && data.metadata.liveGames > 0) {
        return 15 * 1000; // 15 seconds for live games
      }
      return 60 * 1000; // 1 minute for non-live
    },
    refetchOnWindowFocus: true,
  });
}

export function useSchedule(params: {
  season: number;
  week?: number;
  seasonType?: 'preseason' | 'regular' | 'postseason';
}): UseQueryResult<ScheduleResponse, Error> {
  return useQuery({
    queryKey: ['schedule', params.season, params.week, params.seasonType],
    queryFn: () => apiClient.getSchedule(params),
    staleTime: 240 * 1000, // 4 minutes
    refetchInterval: () => {
      // Don't refetch when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      // Scheduled games don't change frequently
      return 300 * 1000; // 5 minutes
    },
    refetchOnWindowFocus: true,
  });
}

export function useLiveGames(): UseQueryResult<LiveGamesResponse, Error> {
  return useQuery({
    queryKey: ['liveGames'],
    queryFn: () => apiClient.getLiveGames(),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: () => {
      // Don't refetch when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 15 * 1000; // Refresh every 15 seconds
    },
    refetchOnWindowFocus: true,
  });
}

export function useGameDetails(
  gameId: string | undefined
): UseQueryResult<GameDetailsResponse, Error> {
  return useQuery({
    queryKey: ['gameDetails', gameId],
    queryFn: () => apiClient.getGameDetails(gameId!),
    enabled: !!gameId,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: (query) => {
      // Don't refetch when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      // Refetch more frequently if game is live
      const data = query.state.data;
      if (data?.game?.isLive) {
        return 10 * 1000; // 10 seconds for live games
      }
      return false; // Don't auto-refetch completed games
    },
    refetchOnWindowFocus: true,
  });
}

export function useTeamGames(
  teamId: string | undefined,
  season: number
): UseQueryResult<TeamGamesResponse, Error> {
  return useQuery({
    queryKey: ['teamGames', teamId, season],
    queryFn: () => apiClient.getTeamGames(teamId!, season),
    enabled: !!teamId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useStandings(season?: number): UseQueryResult<StandingsResponse, Error> {
  return useQuery({
    queryKey: ['standings', season],
    queryFn: () => apiClient.getStandings(season),
    staleTime: 300 * 1000, // 5 minutes
  });
}

export function useTeamDetails(
  teamId: string | undefined
): UseQueryResult<TeamDetailsResponse, Error> {
  return useQuery({
    queryKey: ['teamDetails', teamId],
    queryFn: () => apiClient.getTeamDetails(teamId!),
    enabled: !!teamId,
    staleTime: 300 * 1000, // 5 minutes
  });
}

export function useNews(limit?: number): UseQueryResult<NewsResponse, Error> {
  return useQuery({
    queryKey: ['news', limit],
    queryFn: () => apiClient.getNews(limit),
    staleTime: 120 * 1000, // 2 minutes
  });
}

export function useGameSummary(
  gameId: string | undefined
): UseQueryResult<GameSummaryResponse, Error> {
  return useQuery({
    queryKey: ['gameSummary', gameId],
    queryFn: () => apiClient.getGameSummary(gameId!),
    enabled: !!gameId,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: () => {
      // Don't refetch when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 15 * 1000; // Refresh every 15 seconds for live games
    },
    refetchOnWindowFocus: true,
  });
}

export function useTeamStatistics(
  teamId: string | undefined
): UseQueryResult<TeamStatisticsResponse, Error> {
  return useQuery({
    queryKey: ['teamStatistics', teamId],
    queryFn: () => apiClient.getTeamStatistics(teamId!),
    enabled: !!teamId,
    staleTime: 300 * 1000, // 5 minutes
  });
}
