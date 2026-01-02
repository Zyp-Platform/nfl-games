import type { Game } from '../../domain/entities/game.entity.js';
import type {
  IGameRepository,
  DateRangeParams,
  WeekParams,
  GameFilterParams,
} from '../../domain/repositories/game.repository.js';
import type { SportsDataProvider } from '../providers/base/sports-data-provider.js';

/**
 * Provider-based Game Repository
 * Implements IGameRepository using a sports data provider
 */
export class ProviderGameRepository implements IGameRepository {
  constructor(private provider: SportsDataProvider) {}

  async findById(id: string): Promise<Game | null> {
    // For provider-based repos, we need to fetch and search
    // Try to find the game in current season's games
    const currentYear = new Date().getFullYear();

    // Try fetching all games for the current season
    const games = await this.provider.getGames({ season: currentYear });

    // Search for the game by ID or external ID
    const game = games.find(
      (g) =>
        g.id === id ||
        g.externalIds.espn === id ||
        Object.values(g.externalIds.toObject()).includes(id)
    );

    if (game) {
      return game;
    }

    // If not found in current season, try previous season
    const previousYear = currentYear - 1;
    const previousGames = await this.provider.getGames({ season: previousYear });

    return (
      previousGames.find(
        (g) =>
          g.id === id ||
          g.externalIds.espn === id ||
          Object.values(g.externalIds.toObject()).includes(id)
      ) || null
    );
  }

  async findByExternalId(_provider: string, _externalId: string): Promise<Game | null> {
    // Similar limitation - would need database for efficient lookups
    return null;
  }

  async findByDateRange(params: DateRangeParams): Promise<Game[]> {
    // ESPN API doesn't support date ranges directly
    // Would need to fetch multiple dates and combine
    const games: Game[] = [];
    const currentDate = new Date(params.start);

    while (currentDate <= params.end) {
      const dayGames = await this.provider.getGames({
        season: currentDate.getFullYear(),
        date: new Date(currentDate),
      });
      games.push(...dayGames);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return games;
  }

  async findByWeek(params: WeekParams): Promise<Game[]> {
    return this.provider.getGames({
      season: params.season,
      week: params.week,
      seasonType: params.seasonType,
    });
  }

  async findLive(): Promise<Game[]> {
    const currentYear = new Date().getFullYear();
    const allGames = await this.provider.getGames({ season: currentYear });

    return allGames.filter((game) => game.isLive);
  }

  async findByFilter(params: GameFilterParams): Promise<Game[]> {
    let games: Game[] = [];

    // Fetch based on available parameters
    if (params.week !== undefined && params.season !== undefined) {
      games = await this.findByWeek({
        season: params.season,
        week: params.week,
        seasonType: params.seasonType,
      });
    } else if (params.date) {
      games = await this.provider.getGames({
        season: params.season || params.date.getFullYear(),
        date: params.date,
      });
    } else if (params.season) {
      games = await this.provider.getGames({
        season: params.season,
        seasonType: params.seasonType,
      });
    }

    // Apply filters
    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      games = games.filter((game) => statuses.includes(game.status));
    }

    if (params.teamId) {
      games = games.filter(
        (game) => game.homeTeam.id === params.teamId || game.awayTeam.id === params.teamId
      );
    }

    return games;
  }

  async save(_game: Game): Promise<Game> {
    // Provider-based repository is read-only
    // In a real implementation, this would save to a database
    throw new Error('ProviderGameRepository is read-only');
  }

  async saveMany(_games: Game[]): Promise<Game[]> {
    throw new Error('ProviderGameRepository is read-only');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('ProviderGameRepository is read-only');
  }

  async exists(id: string): Promise<boolean> {
    const game = await this.findById(id);
    return game !== null;
  }
}
