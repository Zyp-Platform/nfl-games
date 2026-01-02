/**
 * ESPN API Response Types
 * These types match the ESPN API structure
 */

export interface ESPNScoreboardResponse {
  leagues?: ESPNLeague[];
  events?: ESPNEvent[];
}

export interface ESPNLeague {
  id: string;
  name: string;
  abbreviation: string;
  season: {
    year: number;
    type: number;
  };
}

export interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
    slug: string;
  };
  week: {
    number: number;
  };
  competitions: ESPNCompetition[];
  status: ESPNStatus;
}

export interface ESPNCompetition {
  id: string;
  date: string;
  attendance?: number;
  venue?: ESPNVenue;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
  broadcasts?: ESPNBroadcast[];
  odds?: unknown[];
}

export interface ESPNVenue {
  id: string;
  fullName: string;
  address?: {
    city: string;
    state?: string;
    country?: string;
  };
  capacity?: number;
  indoor?: boolean;
}

export interface ESPNCompetitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score?: string;
  linescores?: ESPNLineScore[];
  statistics?: unknown[];
  records?: unknown[];
}

export interface ESPNTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  logos?: ESPNLogo[];
}

export interface ESPNLogo {
  href: string;
  width?: number;
  height?: number;
  alt?: string;
  rel?: string[];
}

export interface ESPNLineScore {
  value: number;
  displayValue?: string;
}

export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface ESPNBroadcast {
  market: string;
  names: string[];
}
