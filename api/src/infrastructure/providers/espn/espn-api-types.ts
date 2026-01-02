/**
 * TypeScript interfaces for ESPN API responses
 * These types represent the structure of data returned from ESPN's public API
 */

export interface ESPNLogo {
  href: string;
  alt?: string;
  rel?: string[];
  width?: number;
  height?: number;
}

export interface ESPNRecord {
  type: string;
  summary?: string;
  displayValue?: string;
  stats?: Array<{
    name: string;
    value: number;
  }>;
}

export interface ESPNStat {
  name: string;
  displayName?: string;
  shortDisplayName?: string;
  description?: string;
  abbreviation?: string;
  displayValue: string;
  value?: number;
  label?: string;
}

export interface ESPNTeamReference {
  id: string;
  uid?: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  name?: string;
  nickname?: string;
  logo?: string;
  logos?: ESPNLogo[];
  color?: string;
  alternateColor?: string;
}

export interface ESPNBoxScore {
  team: ESPNTeamReference;
  statistics: ESPNStat[];
}

export interface ESPNAthlete {
  id: string;
  uid?: string;
  displayName: string;
  shortName?: string;
  headshot?: string;
  jersey?: string;
  position?: {
    abbreviation: string;
    displayName: string;
  };
}

export interface ESPNLeaderItem {
  athlete: ESPNAthlete;
  displayValue: string;
  value?: number;
  stats?: string;
}

export interface ESPNLeaderCategory {
  name: string;
  displayName: string;
  shortDisplayName?: string;
  abbreviation?: string;
  leaders: ESPNLeaderItem[];
}

export interface ESPNTeamLeaders {
  team: ESPNTeamReference;
  leaders: ESPNLeaderCategory[];
}

export interface ESPNScoringPlay {
  id: string;
  type: {
    id: string;
    text: string;
    abbreviation?: string;
  };
  text: string;
  awayScore: number;
  homeScore: number;
  period: {
    number: number;
  };
  clock: {
    displayValue: string;
  };
  team: ESPNTeamReference;
  scoringType?: {
    name: string;
    displayName: string;
    abbreviation?: string;
  };
}

export interface ESPNPlay {
  id: string;
  type: {
    id: string;
    text: string;
  };
  text: string;
  awayScore?: number;
  homeScore?: number;
  period?: {
    number: number;
  };
  clock?: {
    displayValue: string;
  };
  scoringPlay?: boolean;
  start?: {
    down?: number;
    distance?: number;
    yardLine?: number;
    yardsToEndzone?: number;
  };
  end?: {
    down?: number;
    distance?: number;
    yardLine?: number;
    yardsToEndzone?: number;
  };
  statYardage?: number;
}

export interface ESPNDrive {
  id: string;
  description: string;
  team: ESPNTeamReference;
  start?: {
    period: {
      number: number;
    };
    clock: {
      displayValue: string;
    };
    yardLine?: number;
    text?: string;
  };
  end?: {
    period: {
      number: number;
    };
    clock: {
      displayValue: string;
    };
    yardLine?: number;
    text?: string;
  };
  timeElapsed?: {
    displayValue: string;
  };
  yards?: number;
  plays?: number;
  isScore?: boolean;
  result?: string;
  displayResult?: string;
}

export interface ESPNDrives {
  current?: ESPNDrive;
  previous: ESPNDrive[];
}

export interface ESPNStanding {
  team: ESPNTeamReference & {
    record?: {
      items?: ESPNRecord[];
    };
  };
  stats?: ESPNStat[];
}

export interface ESPNStandingsGroup {
  name: string;
  abbreviation?: string;
  standings: {
    entries: ESPNStanding[];
  };
}

export interface ESPNNewsArticle {
  headline: string;
  description?: string;
  published: string;
  images?: Array<{
    url: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
  }>;
  links?: {
    web?: {
      href: string;
    };
  };
  categories?: Array<{
    id: string;
    description: string;
    type: string;
  }>;
}

export interface ESPNTeamDetails {
  id: string;
  uid?: string;
  slug?: string;
  location?: string;
  name: string;
  nickname?: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  color?: string;
  alternateColor?: string;
  isActive?: boolean;
  logos?: ESPNLogo[];
  record?: {
    items?: ESPNRecord[];
  };
  standingSummary?: string;
  nextEvent?: Array<{
    id: string;
    name: string;
    shortName?: string;
    date: string;
  }>;
}

export interface ESPNSummaryResponse {
  boxscore?: {
    teams?: ESPNBoxScore[];
  };
  leaders?: ESPNTeamLeaders[];
  scoringPlays?: ESPNScoringPlay[];
  drives?: ESPNDrives;
}
