import type { GameMetadata, Broadcast } from '../../../domain/entities/game.entity.js';
import { Game } from '../../../domain/entities/game.entity.js';
import { TeamReference } from '../../../domain/entities/team.entity.js';
import { Venue } from '../../../domain/entities/venue.entity.js';
import { ExternalIds } from '../../../domain/value-objects/external-ids.js';
import { GameStatus } from '../../../domain/value-objects/game-status.js';
import { Score, PeriodScore } from '../../../domain/value-objects/score.js';
import { GameClock } from '../../../domain/value-objects/game-clock.js';
import type { ESPNEvent, ESPNCompetitor, ESPNStatus, ESPNVenue } from './espn-types.js';

/**
 * Transform ESPN API responses to domain models
 */
export class ESPNTransformer {
  /**
   * Transform ESPN event to Game entity
   */
  static toGame(event: ESPNEvent): Game {
    const competition = event.competitions[0];
    if (!competition) {
      throw new Error(`Event ${event.id} has no competition data`);
    }

    const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) {
      throw new Error(`Event ${event.id} missing home or away competitor`);
    }

    const homeTeam = this.toTeamReference(homeCompetitor);
    const awayTeam = this.toTeamReference(awayCompetitor);
    const status = this.toGameStatus(competition.status);
    const score = this.toScore(homeCompetitor, awayCompetitor);
    const externalIds = new ExternalIds({ espn: event.id });
    const scheduledAt = new Date(event.date);
    const venue = competition.venue ? this.toVenue(competition.venue) : undefined;

    // Extract period and clock from status
    const period = this.toPeriod(competition.status);
    const clock = this.toClock(competition.status);

    // Build metadata
    const metadata: GameMetadata = {
      season: event.season.year,
      seasonType: this.toSeasonType(event.season.type),
      week: event.week?.number,
      attendance: competition.attendance,
      lastModified: new Date(),
    };

    // Extract broadcasts
    const broadcasts: Broadcast[] =
      competition.broadcasts?.map((b) => ({
        network: b.names.join(', '),
        market: b.market,
      })) || [];

    return new Game(
      event.id,
      externalIds,
      homeTeam,
      awayTeam,
      status,
      score,
      scheduledAt,
      metadata,
      venue,
      period,
      clock,
      undefined, // weather not in basic response
      broadcasts
    );
  }

  /**
   * Transform ESPN competitor to TeamReference
   */
  private static toTeamReference(competitor: ESPNCompetitor): TeamReference {
    const team = competitor.team;

    // Get logo URL
    const logo = team.logos?.[0]?.href || team.logo;

    return new TeamReference(
      team.id,
      team.abbreviation,
      team.displayName,
      team.location,
      team.name,
      team.color,
      logo
    );
  }

  /**
   * Transform ESPN venue
   */
  private static toVenue(espnVenue: ESPNVenue): Venue {
    return new Venue(
      espnVenue.id,
      espnVenue.fullName,
      espnVenue.address?.city || 'Unknown',
      espnVenue.address?.state,
      espnVenue.capacity,
      undefined, // surface not in basic response
      espnVenue.indoor
    );
  }

  /**
   * Transform ESPN status to GameStatus
   */
  private static toGameStatus(status: ESPNStatus): GameStatus {
    const state = status.type.state.toLowerCase();
    const completed = status.type.completed;

    // Map ESPN status to our enum
    if (completed) {
      return GameStatus.FINAL;
    }

    if (state === 'pre') {
      return GameStatus.SCHEDULED;
    }

    if (state === 'in') {
      // Check if halftime
      if (status.period === 2 && status.clock === 0) {
        return GameStatus.HALFTIME;
      }
      return GameStatus.IN_PROGRESS;
    }

    if (state === 'post') {
      return GameStatus.FINAL;
    }

    // Default to scheduled
    return GameStatus.SCHEDULED;
  }

  /**
   * Transform scores
   */
  private static toScore(home: ESPNCompetitor, away: ESPNCompetitor): Score {
    const homeScore = parseInt(home.score || '0', 10);
    const awayScore = parseInt(away.score || '0', 10);

    // Extract period scores if available
    const periods: PeriodScore[] = [];

    if (home.linescores && away.linescores) {
      const maxPeriods = Math.max(home.linescores.length, away.linescores.length);

      for (let i = 0; i < maxPeriods; i++) {
        const homePeriod = home.linescores[i]?.value || 0;
        const awayPeriod = away.linescores[i]?.value || 0;
        periods.push(new PeriodScore(homePeriod, awayPeriod));
      }
    }

    return new Score(homeScore, awayScore, periods);
  }

  /**
   * Extract game period from status
   */
  private static toPeriod(status: ESPNStatus): 1 | 2 | 3 | 4 | 'OT' | 'HALFTIME' | undefined {
    const period = status.period;

    if (period === 2 && status.clock === 0) {
      return 'HALFTIME';
    }

    if (period > 4) {
      return 'OT';
    }

    if (period >= 1 && period <= 4) {
      return period as 1 | 2 | 3 | 4;
    }

    return undefined;
  }

  /**
   * Extract game clock from status
   */
  private static toClock(status: ESPNStatus): GameClock | undefined {
    if (!status.displayClock || status.displayClock === '0:00') {
      return undefined;
    }

    try {
      return GameClock.fromDisplay(status.displayClock);
    } catch {
      return undefined;
    }
  }

  /**
   * Map ESPN season type to our type
   */
  private static toSeasonType(type: number): 'preseason' | 'regular' | 'postseason' {
    switch (type) {
      case 1:
        return 'preseason';
      case 2:
        return 'regular';
      case 3:
        return 'postseason';
      default:
        return 'regular';
    }
  }
}
