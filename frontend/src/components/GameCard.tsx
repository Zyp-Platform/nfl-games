import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Tv, Flame } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import type { Game } from '../types/api';

interface GameCardProps {
  game: Game;
  onTeamClick?: (teamId: string) => void;
  possessionTeamId?: string;
}

export function GameCard({ game, onTeamClick, possessionTeamId }: GameCardProps) {
  const navigate = useNavigate();

  const handleTeamClick = (teamId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTeamClick) {
      onTeamClick(teamId);
    } else {
      navigate(`/team/${teamId}`);
    }
  };

  const getStatusDisplay = () => {
    if (game.status === 'SCHEDULED') {
      return format(new Date(game.scheduledAt), 'EEE MMM d h:mma');
    }
    if (game.status === 'HALFTIME') {
      return 'HALF';
    }
    if (game.status === 'IN_PROGRESS' && game.clock) {
      return `Q${game.period} ${game.clock}`;
    }
    if (game.status.includes('FINAL')) {
      return format(new Date(game.scheduledAt), 'EEE MMM d h:mma');
    }
    return game.status;
  };

  const isWinning = (team: 'home' | 'away') => {
    if (!game.isCompleted && !game.isLive) return false;
    return team === 'home' ? game.score.home > game.score.away : game.score.away > game.score.home;
  };

  // Only allow clicking to details for live or completed games
  const isClickable = game.isLive || game.isCompleted;

  const cardElement = (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        isClickable && 'hover:shadow-lg hover:border-primary/50',
        game.isLive && 'ring-1 ring-green-500/50 bg-green-50/5'
      )}
    >
      <div className="p-2">
        {/* Main Score Line - Both teams horizontal */}
        <div className="flex items-center gap-2">
          {/* Away Team */}
          <div
            className={cn(
              'flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity',
              possessionTeamId === game.awayTeam.id && 'bg-green-600/10 rounded px-1 -mx-1'
            )}
            onClick={(e) => handleTeamClick(game.awayTeam.id, e)}
          >
            {game.awayTeam.logo && (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.abbreviation}
                className="w-6 h-6 object-contain"
              />
            )}
            <div
              className={cn(
                'font-bold text-sm',
                isWinning('away') && 'text-primary',
                possessionTeamId === game.awayTeam.id && 'text-green-600'
              )}
            >
              {game.awayTeam.abbreviation}
            </div>
          </div>

          {/* Score or Date/Time */}
          {game.status === 'SCHEDULED' ? (
            <div className="flex flex-col items-center text-xs text-muted-foreground font-medium min-w-[60px]">
              <div>{format(new Date(game.scheduledAt), 'MMM d')}</div>
              <div>{format(new Date(game.scheduledAt), 'h:mma')}</div>
            </div>
          ) : (
            <div className="flex items-center gap-1 font-bold text-base tabular-nums">
              <span className={cn(isWinning('away') ? 'text-primary' : 'text-muted-foreground')}>
                {game.score.away}
              </span>
              <span className="text-muted-foreground text-xs">-</span>
              <span className={cn(isWinning('home') ? 'text-primary' : 'text-muted-foreground')}>
                {game.score.home}
              </span>
            </div>
          )}

          {/* Home Team */}
          <div
            className={cn(
              'flex items-center gap-1 flex-1 min-w-0 justify-end cursor-pointer hover:opacity-70 transition-opacity',
              possessionTeamId === game.homeTeam.id && 'bg-green-600/10 rounded px-1 -mx-1'
            )}
            onClick={(e) => handleTeamClick(game.homeTeam.id, e)}
          >
            <div
              className={cn(
                'font-bold text-sm',
                isWinning('home') && 'text-primary',
                possessionTeamId === game.homeTeam.id && 'text-green-600'
              )}
            >
              {game.homeTeam.abbreviation}
            </div>
            {game.homeTeam.logo && (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.abbreviation}
                className="w-6 h-6 object-contain"
              />
            )}
          </div>
        </div>

        {/* Details Line */}
        <div className="flex items-center justify-between mt-1 pt-1 border-t text-xs text-muted-foreground">
          {/* Status */}
          <div
            className={cn('flex items-center gap-1 font-medium', game.isLive && 'text-green-600')}
          >
            {game.isLive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600"></span>
              </span>
            )}
            <span className="text-xs">{getStatusDisplay()}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Badges */}
            {game.isClutchTime && (
              <Badge variant="destructive" className="h-4 text-xs gap-0.5 px-1.5">
                <Flame className="h-2.5 w-2.5" />
                CLUTCH
              </Badge>
            )}

            {/* Broadcast */}
            {game.broadcasts.length > 0 && (
              <div className="flex items-center gap-0.5">
                <Tv className="h-2.5 w-2.5" />
                <span className="text-xs">{game.broadcasts[0].network}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  // Wrap with Link if clickable, otherwise just return the card
  return isClickable ? (
    <Link to={`/game/${game.id}`} className="block group">
      {cardElement}
    </Link>
  ) : (
    <div className="block">{cardElement}</div>
  );
}
