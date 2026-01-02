import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface ScoreboardNavState {
  week: number;
  maxWeek: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onMenuOpen: () => void;
}

const ScoreboardNavContext = createContext<ScoreboardNavState | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useScoreboardNav() {
  return useContext(ScoreboardNavContext);
}

interface ScoreboardNavProviderProps {
  value: ScoreboardNavState;
  children: ReactNode;
}

export function ScoreboardNavProvider({ value, children }: ScoreboardNavProviderProps) {
  return <ScoreboardNavContext.Provider value={value}>{children}</ScoreboardNavContext.Provider>;
}
