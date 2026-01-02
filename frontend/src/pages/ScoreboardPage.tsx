import { useState, useCallback } from 'react';
import { useScoreboard } from '../lib/queries';
import { GameCard } from '../components/GameCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Select } from '../components/ui/select';
import { WeekSelector } from '../components/WeekSelector';
import { ScoreboardNavProvider } from '../contexts/ScoreboardNavContext';

/**
 * Calculate the current NFL week based on the date
 * NFL season typically starts first Thursday after Labor Day (first Monday in September)
 * Regular season is 18 weeks
 */
function getCurrentNFLWeek(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // NFL season runs September through February
  // Regular season: ~Sept 5 - early January (18 weeks)
  // If before September, we're in offseason - default to week 1
  if (month < 8) {
    // Before September
    return 1;
  }

  // Approximate NFL season start: first Thursday after first Monday in September
  // For simplicity, assume season starts ~Sept 5
  const seasonStart = new Date(year, 8, 5); // Sept 5

  // If we're after February, we're in offseason
  if (month > 1 && month < 8) {
    // March through August
    return 1;
  }

  // Calculate weeks since season start
  const daysSinceStart = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1;

  // Clamp to 1-18 for regular season
  return Math.max(1, Math.min(18, weeksSinceStart));
}

export function ScoreboardPage() {
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear);
  const [week, setWeek] = useState(getCurrentNFLWeek());
  const [seasonType, setSeasonType] = useState<'preseason' | 'regular' | 'postseason'>('regular');
  const [menuOpen, setMenuOpen] = useState(false);

  const { data, isLoading, error, refetch } = useScoreboard({ season, week, seasonType });

  const maxWeek = seasonType === 'regular' ? 18 : 4;

  const goToWeek = useCallback(
    (newWeek: number) => {
      setWeek(Math.max(1, Math.min(maxWeek, newWeek)));
    },
    [maxWeek]
  );

  const handlePrevWeek = useCallback(() => goToWeek(week - 1), [week, goToWeek]);
  const handleNextWeek = useCallback(() => goToWeek(week + 1), [week, goToWeek]);
  const handleMenuToggle = useCallback(() => setMenuOpen((prev) => !prev), []);

  const navState = {
    week,
    maxWeek,
    onPrevWeek: handlePrevWeek,
    onNextWeek: handleNextWeek,
    onMenuOpen: handleMenuToggle,
  };

  return (
    <ScoreboardNavProvider value={navState}>
      <div className="container mx-auto px-2 py-3 pt-16 pb-20 space-y-3">
        {/* Week Selector Bar - Inline Navigation */}
        <WeekSelector
          week={week}
          maxWeek={maxWeek}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onMenuOpen={handleMenuToggle}
        />

        {/* Season Type Header */}
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {season}{' '}
            {seasonType === 'regular'
              ? 'Regular Season'
              : seasonType === 'preseason'
                ? 'Preseason'
                : 'Playoffs'}
          </span>
        </div>

        {/* Slide-out Filter Menu */}
        {menuOpen && (
          <div className="bg-card border rounded-lg p-3 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              {/* Season */}
              <Select
                label="Season"
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              {/* Season Type */}
              <Select
                label="Season Type"
                value={seasonType}
                onChange={(e) => {
                  const newType = e.target.value as typeof seasonType;
                  setSeasonType(newType);
                  // Reset to week 1 when changing season type
                  setWeek(1);
                }}
              >
                <option value="preseason">Preseason</option>
                <option value="regular">Regular Season</option>
                <option value="postseason">Playoffs</option>
              </Select>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading && <LoadingSpinner />}

        {error && <ErrorMessage error={error} retry={() => refetch()} />}

        {data && data.games.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🏈</div>
            <p className="text-xl font-semibold text-muted-foreground">
              No games found for this week
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try selecting a different week or season
            </p>
          </div>
        )}

        {data && data.games.length > 0 && (
          <div className="space-y-3">
            {/* Group games by date */}
            {(() => {
              const gamesByDate = data.games.reduce(
                (acc, game) => {
                  const date = new Date(game.scheduledAt).toDateString();
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(game);
                  return acc;
                },
                {} as Record<string, typeof data.games>
              );

              // Sort dates in descending order (most recent first)
              const sortedEntries = Object.entries(gamesByDate).sort((a, b) => {
                return new Date(b[0]).getTime() - new Date(a[0]).getTime();
              });

              return sortedEntries.map(([date, games]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground/80 px-1">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="space-y-2">
                    {games.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </ScoreboardNavProvider>
  );
}
