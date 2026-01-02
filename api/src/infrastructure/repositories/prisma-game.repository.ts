import type { Game as PrismaGame, Team as PrismaTeam, Venue as PrismaVenue } from '@prisma/client';
import { Game } from '../../domain/entities/game.entity.js';
import { TeamReference } from '../../domain/entities/team.entity.js';
import { Venue } from '../../domain/entities/venue.entity.js';
import { ExternalIds } from '../../domain/value-objects/external-ids.js';
import type { GameStatus } from '../../domain/value-objects/game-status.js';
import { Score, PeriodScore } from '../../domain/value-objects/score.js';
import type {
  IGameRepository,
  DateRangeParams,
  WeekParams,
  GameFilterParams,
} from '../../domain/repositories/game.repository.js';
import { prisma } from '../database/prisma.client.js';

/**
 * Database game record with relations
 */
type DbGameWithRelations = PrismaGame & {
  homeTeam: PrismaTeam;
  awayTeam: PrismaTeam;
  venue?: PrismaVenue | null;
};

/**
 * Prisma-based Game Repository
 * Implements IGameRepository using Prisma ORM
 */
export class PrismaGameRepository implements IGameRepository {
  async findById(id: string): Promise<Game | null> {
    const dbGame = await prisma.game.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
      },
    });

    if (!dbGame) return null;

    return this.mapDbGameToEntity(dbGame);
  }

  async findByExternalId(provider: string, externalId: string): Promise<Game | null> {
    let dbGame;

    if (provider === 'espn') {
      dbGame = await prisma.game.findUnique({
        where: { espnId: externalId },
        include: {
          homeTeam: true,
          awayTeam: true,
          venue: true,
        },
      });
    } else if (provider === 'sportsradar') {
      dbGame = await prisma.game.findUnique({
        where: { sportsRadarId: externalId },
        include: {
          homeTeam: true,
          awayTeam: true,
          venue: true,
        },
      });
    }

    if (!dbGame) return null;

    return this.mapDbGameToEntity(dbGame);
  }

  async findByDateRange(params: DateRangeParams): Promise<Game[]> {
    const dbGames = await prisma.game.findMany({
      where: {
        scheduledAt: {
          gte: params.start,
          lte: params.end,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return dbGames.map((g) => this.mapDbGameToEntity(g));
  }

  async findByWeek(params: WeekParams): Promise<Game[]> {
    const dbGames = await prisma.game.findMany({
      where: {
        season: params.season,
        week: params.week,
        seasonType: params.seasonType,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return dbGames.map((g) => this.mapDbGameToEntity(g));
  }

  async findLive(): Promise<Game[]> {
    const dbGames = await prisma.game.findMany({
      where: {
        status: { in: ['live', 'halftime'] },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return dbGames.map((g) => this.mapDbGameToEntity(g));
  }

  async findByFilter(params: GameFilterParams): Promise<Game[]> {
    // Build Prisma where clause with proper typing
    type PrismaWhereInput = NonNullable<Parameters<typeof prisma.game.findMany>[0]>['where'];
    const where: PrismaWhereInput = {};

    if (params.week !== undefined && params.season !== undefined) {
      where.season = params.season;
      where.week = params.week;
      if (params.seasonType) {
        where.seasonType = params.seasonType;
      }
    } else if (params.date) {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.scheduledAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (params.season) {
      where.season = params.season;
      if (params.seasonType) {
        where.seasonType = params.seasonType;
      }
    }

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      where.status = { in: statuses };
    }

    if (params.teamId) {
      where.OR = [{ homeTeamId: params.teamId }, { awayTeamId: params.teamId }];
    }

    const dbGames = await prisma.game.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return dbGames.map((g) => this.mapDbGameToEntity(g));
  }

  async save(game: Game): Promise<Game> {
    const externalIds = game.externalIds.toObject();
    const periodScores = game.score.periods.map((p) => ({
      home: p.home,
      away: p.away,
    }));

    const dbGame = await prisma.game.upsert({
      where: { id: game.id },
      create: {
        id: game.id,
        espnId: externalIds['espn'],
        sportsRadarId: externalIds['sportsradar'],
        homeTeamId: game.homeTeam.id,
        awayTeamId: game.awayTeam.id,
        status: game.status as string,
        homeScore: game.score.home,
        awayScore: game.score.away,
        scheduledAt: game.scheduledAt,
        startedAt: undefined,
        completedAt: undefined,
        season: game.metadata.season,
        seasonType: game.metadata.seasonType,
        week: game.metadata.week,
        period: game.period ? String(game.period) : null,
        clock: game.clock ? String(game.clock) : null,
        venueId: game.venue?.id,
        attendance: game.metadata.attendance,
        weather: game.weather ? JSON.stringify(game.weather) : null,
        broadcasts: game.broadcasts.length > 0 ? JSON.stringify(game.broadcasts) : null,
        periodScores: periodScores.length > 0 ? JSON.stringify(periodScores) : null,
      },
      update: {
        espnId: externalIds['espn'],
        sportsRadarId: externalIds['sportsradar'],
        status: game.status as string,
        homeScore: game.score.home,
        awayScore: game.score.away,
        startedAt: game.isLive ? new Date() : undefined,
        completedAt: game.isCompleted ? new Date() : undefined,
        period: game.period ? String(game.period) : null,
        clock: game.clock ? String(game.clock) : null,
        weather: game.weather ? JSON.stringify(game.weather) : null,
        broadcasts: game.broadcasts.length > 0 ? JSON.stringify(game.broadcasts) : null,
        periodScores: periodScores.length > 0 ? JSON.stringify(periodScores) : null,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
      },
    });

    return this.mapDbGameToEntity(dbGame);
  }

  async saveMany(games: Game[]): Promise<Game[]> {
    const saved: Game[] = [];

    for (const game of games) {
      const result = await this.save(game);
      saved.push(result);
    }

    return saved;
  }

  async delete(id: string): Promise<void> {
    await prisma.game.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.game.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Map database game record to domain entity
   */
  private mapDbGameToEntity(dbGame: DbGameWithRelations): Game {
    const externalIds = new ExternalIds({
      ...(dbGame.espnId && { espn: dbGame.espnId }),
      ...(dbGame.sportsRadarId && { sportsradar: dbGame.sportsRadarId }),
    });

    const homeTeam = new TeamReference(
      dbGame.homeTeam.id,
      dbGame.homeTeam.abbreviation,
      dbGame.homeTeam.displayName,
      dbGame.homeTeam.location || undefined,
      dbGame.homeTeam.nickname || undefined,
      dbGame.homeTeam.color || undefined,
      dbGame.homeTeam.logo || undefined
    );

    const awayTeam = new TeamReference(
      dbGame.awayTeam.id,
      dbGame.awayTeam.abbreviation,
      dbGame.awayTeam.displayName,
      dbGame.awayTeam.location || undefined,
      dbGame.awayTeam.nickname || undefined,
      dbGame.awayTeam.color || undefined,
      dbGame.awayTeam.logo || undefined
    );

    const periodScores: PeriodScore[] = [];
    if (dbGame.periodScores) {
      const parsed = JSON.parse(dbGame.periodScores);
      for (const ps of parsed) {
        periodScores.push(new PeriodScore(ps.home, ps.away));
      }
    }

    const score = new Score(dbGame.homeScore, dbGame.awayScore, periodScores);

    const venue = dbGame.venue
      ? new Venue(
          dbGame.venue.id,
          dbGame.venue.name,
          dbGame.venue.city,
          dbGame.venue.state || undefined,
          dbGame.venue.capacity || undefined,
          dbGame.venue.surface || undefined,
          dbGame.venue.indoor || undefined
        )
      : undefined;

    const weather = dbGame.weather ? JSON.parse(dbGame.weather) : undefined;
    const broadcasts = dbGame.broadcasts ? JSON.parse(dbGame.broadcasts) : [];

    return new Game(
      dbGame.id,
      externalIds,
      homeTeam,
      awayTeam,
      dbGame.status as GameStatus,
      score,
      dbGame.scheduledAt,
      {
        season: dbGame.season,
        seasonType: dbGame.seasonType as 'preseason' | 'regular' | 'postseason',
        week: dbGame.week || undefined,
        attendance: dbGame.attendance || undefined,
        lastModified: new Date(),
      },
      venue,
      (dbGame.period ? (dbGame.period as 1 | 2 | 3 | 4 | 'OT' | 'HALFTIME') : undefined),
      undefined, // GameClock would need to be parsed separately
      weather,
      broadcasts
    );
  }
}
