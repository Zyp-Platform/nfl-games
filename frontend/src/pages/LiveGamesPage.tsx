import { Radio, Flame, Circle } from 'lucide-react';
import { useLiveGames, useGameSummary } from '../lib/queries';
import { GameCard } from '../components/GameCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Badge } from '../components/ui/badge';
import type { Game } from '../types/api';

interface LiveGameCardProps {
  game: Game;
}

function LiveGameCard({ game }: LiveGameCardProps) {
  const { data: summaryData } = useGameSummary(game.id);
  const currentDrive = summaryData?.drives?.current;

  return (
    <div className="space-y-1">
      <GameCard game={game} possessionTeamId={currentDrive?.team.id} />
      {currentDrive && (
        <div className="px-2 py-1 text-xs font-bold text-green-600">
          {currentDrive.team.abbreviation}: {currentDrive.description}
        </div>
      )}
    </div>
  );
}

export function LiveGamesPage() {
  const { data, isLoading, error, refetch } = useLiveGames();

  const clutchTimeGames = data?.games.filter((g) => g.isClutchTime) || [];

  return (
    <div className="container mx-auto px-2 py-3 pb-20 space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between bg-card rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-green-600" />
          <h1 className="text-lg font-bold">Live Games</h1>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Updates every 15s</p>
      </div>

      {/* Compact Stats */}
      {data && (
        <div className="flex gap-2">
          <div className="flex-1 bg-card rounded-lg p-2 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-green-600">{data.metadata.totalLiveGames}</p>
              </div>
              <Circle className="h-6 w-6 text-green-600 fill-green-600 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 bg-card rounded-lg p-2 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Clutch Time</p>
                <p className="text-xl font-bold text-orange-600">{data.metadata.clutchTimeGames}</p>
              </div>
              <Flame className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading && <LoadingSpinner />}

      {error && <ErrorMessage error={error} retry={() => refetch()} />}

      {data && data.games.length === 0 && (
        <div className="bg-card rounded-lg p-8 text-center border">
          <div className="text-6xl mb-4 opacity-50">🏈</div>
          <h3 className="text-lg font-bold mb-2">No Live Games</h3>
          <p className="text-sm text-muted-foreground">Check back during game days (Sun/Mon/Thu)</p>
        </div>
      )}

      {data && data.games.length > 0 && (
        <div className="space-y-3">
          {/* Clutch Time Games */}
          {clutchTimeGames.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Flame className="h-4 w-4 text-orange-600" />
                <h2 className="text-sm font-bold">Clutch Time</h2>
                <Badge variant="clutch" className="gap-1 text-xs h-5">
                  {clutchTimeGames.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {clutchTimeGames.map((game) => (
                  <LiveGameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* All Live Games */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Circle className="h-4 w-4 text-green-600 fill-green-600 animate-pulse" />
              <h2 className="text-sm font-bold">All Live</h2>
              <Badge variant="live" className="gap-1 text-xs h-5">
                {data.games.length}
              </Badge>
            </div>
            <div className="space-y-1">
              {data.games.map((game) => (
                <LiveGameCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
