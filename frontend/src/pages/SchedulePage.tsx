import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, Tv } from 'lucide-react';
import { useScoreboard } from '../lib/queries';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Select } from '../components/ui/select';

/**
 * Comprehensive Schedule Page
 * Shows all games for all teams across multiple weeks
 */
export function SchedulePage() {
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear); // Default to current year
  const [seasonType, setSeasonType] = useState<'preseason' | 'regular' | 'postseason'>('regular');

  // Fetch weeks 1-18 using scoreboard (which returns ALL games, not just upcoming)
  const week1 = useScoreboard({ season, week: 1, seasonType });
  const week2 = useScoreboard({ season, week: 2, seasonType });
  const week3 = useScoreboard({ season, week: 3, seasonType });
  const week4 = useScoreboard({ season, week: 4, seasonType });
  const week5 = useScoreboard({ season, week: 5, seasonType });
  const week6 = useScoreboard({ season, week: 6, seasonType });
  const week7 = useScoreboard({ season, week: 7, seasonType });
  const week8 = useScoreboard({ season, week: 8, seasonType });
  const week9 = useScoreboard({ season, week: 9, seasonType });
  const week10 = useScoreboard({ season, week: 10, seasonType });
  const week11 = useScoreboard({ season, week: 11, seasonType });
  const week12 = useScoreboard({ season, week: 12, seasonType });
  const week13 = useScoreboard({ season, week: 13, seasonType });
  const week14 = useScoreboard({ season, week: 14, seasonType });
  const week15 = useScoreboard({ season, week: 15, seasonType });
  const week16 = useScoreboard({ season, week: 16, seasonType });
  const week17 = useScoreboard({ season, week: 17, seasonType });
  const week18 = useScoreboard({ season, week: 18, seasonType });

  const weekQueries = [
    week1,
    week2,
    week3,
    week4,
    week5,
    week6,
    week7,
    week8,
    week9,
    week10,
    week11,
    week12,
    week13,
    week14,
    week15,
    week16,
    week17,
    week18,
  ];

  // Combine all week data
  const isLoading = weekQueries.some((q) => q.isLoading);
  const error = weekQueries.find((q) => q.error)?.error;
  const refetch = () => weekQueries.forEach((q) => q.refetch());

  // Filter for upcoming games only (not completed, not live - only future games)
  const allGames = weekQueries.flatMap((q) => q.data?.games || []);
  const upcomingGames = allGames.filter((game) => !game.isCompleted && !game.isLive);

  // Sort by scheduled date (next game first)
  const sortedGames = upcomingGames.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const data = {
    games: sortedGames,
    metadata: {
      totalGames: sortedGames.length,
      season,
      seasonType,
    },
  };

  const navigate = useNavigate();

  // Group games by week
  const gamesByWeek =
    data?.games.reduce(
      (acc, game) => {
        const week = game.metadata.week;
        if (week === undefined) return acc; // Skip games without week metadata
        if (!acc[week]) acc[week] = [];
        acc[week].push(game);
        return acc;
      },
      {} as Record<number, typeof data.games>
    ) || {};

  const weeks = Object.keys(gamesByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="container mx-auto px-2 py-3 pb-16 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Schedule</h1>
              <p className="text-xs text-muted-foreground">Upcoming games</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <Select label="Season" value={season} onChange={(e) => setSeason(Number(e.target.value))}>
            {[currentYear, currentYear - 1].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>

          <Select
            label="Season Type"
            value={seasonType}
            onChange={(e) => setSeasonType(e.target.value as typeof seasonType)}
          >
            <option value="preseason">Preseason</option>
            <option value="regular">Regular Season</option>
            <option value="postseason">Playoffs</option>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading && <LoadingSpinner />}

      {error && <ErrorMessage error={error} retry={() => refetch()} />}

      {data && data.games.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-xl font-semibold text-muted-foreground">No upcoming games</p>
          <p className="text-sm text-muted-foreground mt-2">
            {seasonType === 'regular'
              ? `All ${season} regular season games have been completed`
              : `No upcoming ${seasonType} games for ${season}`}
          </p>
        </div>
      )}

      {data && weeks.length > 0 && (
        <div className="space-y-6">
          {/* Total Games Summary */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              {data.games.length} upcoming {data.games.length === 1 ? 'game' : 'games'} across{' '}
              {weeks.length} {weeks.length === 1 ? 'week' : 'weeks'}
            </p>
          </div>

          {/* Games grouped by week */}
          {weeks.map((week) => {
            const weekGames = gamesByWeek[week];

            // Group games by date within each week
            const gamesByDate = weekGames.reduce(
              (acc, game) => {
                const date = new Date(game.scheduledAt).toDateString();
                if (!acc[date]) acc[date] = [];
                acc[date].push(game);
                return acc;
              },
              {} as Record<string, typeof weekGames>
            );

            return (
              <div key={week} className="space-y-3">
                {/* Week Header */}
                <div className="sticky top-0 z-10 bg-background border-b pb-2">
                  <h2 className="text-lg font-bold text-primary">Week {week}</h2>
                  <p className="text-xs text-muted-foreground">
                    {weekGames.length} {weekGames.length === 1 ? 'game' : 'games'}
                  </p>
                </div>

                {/* Games by date */}
                <div className="space-y-4">
                  {Object.entries(gamesByDate)
                    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                    .map(([date, games]) => (
                      <div key={date} className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground/80 px-1">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </h3>

                        <div className="space-y-1.5">
                          {games
                            .sort(
                              (a, b) =>
                                new Date(a.scheduledAt).getTime() -
                                new Date(b.scheduledAt).getTime()
                            )
                            .map((game) => (
                              <button
                                key={game.id}
                                onClick={() => navigate(`/game/${game.id}`)}
                                className="w-full p-3 rounded-lg border bg-card hover:bg-muted transition-colors text-left"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  {/* Time */}
                                  <div className="flex flex-col items-center min-w-[65px]">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {format(new Date(game.scheduledAt), 'h:mm a')}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {format(new Date(game.scheduledAt), 'EEE')}
                                    </span>
                                  </div>

                                  {/* Teams */}
                                  <div className="flex-1 space-y-1">
                                    {/* Away Team */}
                                    <div className="flex items-center gap-2">
                                      {game.awayTeam.logo && (
                                        <img
                                          src={game.awayTeam.logo}
                                          alt={game.awayTeam.abbreviation}
                                          className="w-5 h-5"
                                        />
                                      )}
                                      <span className="text-sm font-medium">
                                        {game.awayTeam.displayName}
                                      </span>
                                    </div>

                                    {/* Home Team */}
                                    <div className="flex items-center gap-2">
                                      {game.homeTeam.logo && (
                                        <img
                                          src={game.homeTeam.logo}
                                          alt={game.homeTeam.abbreviation}
                                          className="w-5 h-5"
                                        />
                                      )}
                                      <span className="text-sm font-medium">
                                        {game.homeTeam.displayName}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Broadcast */}
                                  {game.broadcasts.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[60px] justify-end">
                                      <Tv className="h-3 w-3" />
                                      <span className="truncate">{game.broadcasts[0].network}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Venue */}
                                {game.venue && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    📍 {game.venue.name}
                                    {game.venue.city && `, ${game.venue.city}`}
                                    {game.venue.state && `, ${game.venue.state}`}
                                  </div>
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
