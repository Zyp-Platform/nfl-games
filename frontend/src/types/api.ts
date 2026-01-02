/**
 * API Types for Football API
 */

export interface Team {
  id: string;
  abbreviation: string;
  displayName: string;
  location?: string;
  nickname?: string;
  color?: string;
  logo?: string;
}

export interface Score {
  home: number;
  away: number;
  differential: number;
  periods: Array<{
    home: number;
    away: number;
  }>;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  state?: string;
  capacity?: number;
  surface?: string;
  indoor?: boolean;
}

export interface Broadcast {
  network: string;
  market?: string;
}

export interface Weather {
  temperature?: number;
  conditions?: string;
  wind?: string;
  humidity?: number;
}

export type GameStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'HALFTIME'
  | 'FINAL'
  | 'FINAL_OVERTIME'
  | 'POSTPONED'
  | 'CANCELED'
  | 'SUSPENDED';

export type GamePeriod = 1 | 2 | 3 | 4 | 'OT' | 'HALFTIME';

export interface GameMetadata {
  season: number;
  seasonType: 'preseason' | 'regular' | 'postseason';
  week?: number;
  attendance?: number;
  lastModified: string;
}

export interface Game {
  id: string;
  externalIds: Record<string, string>;
  homeTeam: Team;
  awayTeam: Team;
  status: GameStatus;
  score: Score;
  scheduledAt: string;
  metadata: GameMetadata;
  venue?: Venue;
  period?: GamePeriod;
  clock?: string;
  weather?: Weather;
  broadcasts: Broadcast[];
  isLive: boolean;
  isCompleted: boolean;
  isClutchTime: boolean;
  title: string;
  shortTitle: string;
}

export interface ScoreboardResponse {
  games: Game[];
  metadata: {
    season: number;
    week: number;
    seasonType: string;
    totalGames: number;
    liveGames: number;
    completedGames: number;
    cacheHit: boolean;
    timestamp: string;
  };
}

export interface ScheduleResponse {
  games: Game[];
  metadata: {
    season: number;
    week: number | string;
    seasonType: string;
    totalGames: number;
    upcomingGames: number;
    cacheHit: boolean;
    timestamp: string;
  };
}

export interface LiveGamesResponse {
  games: Game[];
  metadata: {
    totalLiveGames: number;
    clutchTimeGames: number;
    cacheHit: boolean;
    timestamp: string;
  };
}

export interface GameDetailsResponse {
  game: Game;
  metadata: {
    cacheHit: boolean;
    timestamp: string;
  };
}

export interface TeamGamesResponse {
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    logo?: string;
  } | null;
  games: Game[];
  metadata: {
    season: number;
    totalGames: number;
    timestamp: string;
  };
}

export interface StandingsTeam {
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    logo?: string;
  };
  stats: {
    wins: string;
    losses: string;
    winPercent: string;
    streak: string;
    pointDifferential: string;
  };
}

export interface StandingsResponse {
  season: number;
  conferences: Array<{
    id: string;
    name: string;
    abbreviation: string;
    divisions: Record<string, StandingsTeam[]>;
  }>;
  metadata: {
    timestamp: string;
  };
}

export interface TeamDetailsResponse {
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    location: string;
    name: string;
    nickname: string;
    color: string;
    alternateColor: string;
    logo: string;
    logos: Array<{
      href: string;
      width: number;
      height: number;
      rel: string[];
    }>;
  };
  record: {
    summary: string;
    wins: number;
    losses: number;
    ties: number;
    winPercent: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDifferential: number;
    streak: number;
    playoffSeed: number;
    divisionWins: number;
    divisionLosses: number;
    home: {
      summary: string;
      wins: number;
      losses: number;
    } | null;
    away: {
      summary: string;
      wins: number;
      losses: number;
    } | null;
  } | null;
  nextEvent: {
    id: string;
    date: string;
    name: string;
    shortName: string;
  } | null;
  roster: Array<{
    position: string;
    items: Array<{
      id: string;
      displayName: string;
      shortName: string;
      jersey: string;
      position: string;
      headshot: string;
      age: number;
      height: string;
      weight: string;
      experience: number;
      college: string;
      debutYear: number;
      status: string;
      injuries: Array<{
        status: string;
        date: string;
        details: string;
        description: string;
      }>;
      birthPlace: {
        city: string;
        state: string;
        country: string;
      } | null;
    }>;
  }> | null;
  metadata: {
    timestamp: string;
  };
}

export interface NewsArticle {
  id: number;
  headline: string;
  description: string;
  type: string;
  published: string;
  lastModified: string;
  premium: boolean;
  images: Array<{
    url: string;
    width: number;
    height: number;
    caption: string;
    alt: string;
  }>;
  links: {
    web: string;
    api: string;
  };
  categories: Array<{
    id: number;
    type: string;
    description: string;
    team: {
      id: string;
      abbreviation: string;
      displayName: string;
    } | null;
    athlete: {
      id: string;
      displayName: string;
    } | null;
  }>;
}

export interface NewsResponse {
  header: string;
  articles: NewsArticle[];
  metadata: {
    total: number;
    limit: number;
    timestamp: string;
  };
}

export interface GameSummaryResponse {
  boxscore: Array<{
    team: {
      id: string;
      abbreviation: string;
      displayName: string;
      logo: string;
    };
    statistics: Array<{
      name: string;
      displayValue: string;
      label: string;
    }>;
  }>;
  leaders: Array<{
    team: {
      id: string;
      abbreviation: string;
      displayName: string;
      logo: string;
    };
    leaders: Array<{
      name: string;
      displayName: string;
      leaders: Array<{
        displayValue: string;
        athlete: {
          id: string;
          displayName: string;
          shortName: string;
          headshot: string;
          jersey: string;
          position: string;
        };
      }>;
    }>;
  }>;
  scoringPlays: Array<{
    id: string;
    type: string;
    text: string;
    awayScore: number;
    homeScore: number;
    period: number;
    clock: string;
    team: {
      id: string;
      abbreviation: string;
      displayName: string;
    };
  }>;
  drives: {
    current: {
      id: string;
      description: string;
      team: {
        id: string;
        abbreviation: string;
        displayName: string;
      };
      start: string | null;
      timeElapsed: number | null;
    } | null;
    previous: Array<{
      id: string;
      description: string;
      team: {
        id: string;
        abbreviation: string;
        displayName: string;
      };
      start: string | null;
      end: string | null;
      timeElapsed: number | null;
      result: string;
    }>;
  };
  metadata: {
    timestamp: string;
  };
}

export interface TeamStatistic {
  name: string;
  displayName: string;
  description: string;
  value: number;
  displayValue: string;
  rank: number;
  rankDisplayValue: string;
}

export interface TeamStatCategory {
  name: string;
  displayName: string;
  stats: TeamStatistic[];
}

export interface TeamStatisticsResponse {
  statistics: {
    passing: TeamStatCategory;
    rushing: TeamStatCategory;
    receiving: TeamStatCategory;
    defensive: TeamStatCategory;
    general: TeamStatCategory;
    scoring: TeamStatCategory;
  };
  metadata: {
    timestamp: string;
  };
}
