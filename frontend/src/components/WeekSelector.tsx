import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { cn } from '../lib/utils';

interface WeekSelectorProps {
  week: number;
  maxWeek?: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onMenuOpen: () => void;
}

/**
 * WeekSelector Component
 * Inline week navigation controls for Scoreboard page
 * Replaces fixed BottomNav for ZypPilot shell integration
 */
export function WeekSelector({
  week,
  maxWeek = 18,
  onPrevWeek,
  onNextWeek,
  onMenuOpen,
}: WeekSelectorProps) {
  const canGoPrev = week > 1;
  const canGoNext = week < maxWeek;

  return (
    <div className="flex items-center justify-between py-3 px-2 bg-card border rounded-lg">
      {/* Filter Button */}
      <button
        onClick={onMenuOpen}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
        <span>Filter</span>
      </button>

      {/* Week Navigation */}
      <div className="flex items-center gap-4">
        {/* Previous Week Button */}
        <button
          onClick={onPrevWeek}
          disabled={!canGoPrev}
          className={cn(
            'flex items-center gap-1 text-sm font-medium transition-colors',
            canGoPrev
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-muted-foreground/50 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        {/* Current Week Display */}
        <div className="text-base font-bold text-primary min-w-[60px] text-center">Week {week}</div>

        {/* Next Week Button */}
        <button
          onClick={onNextWeek}
          disabled={!canGoNext}
          className={cn(
            'flex items-center gap-1 text-sm font-medium transition-colors',
            canGoNext
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-muted-foreground/50 cursor-not-allowed'
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
