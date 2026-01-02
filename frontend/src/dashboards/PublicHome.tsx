/**
 * PublicHome - Landing page for unauthenticated users
 * Community SPA entry point for public access
 */

import { useEffect } from 'react';
import type { DashboardProps } from './types';
import { ScoreboardPage } from '../pages/ScoreboardPage';
import { setCommunityContext } from '../lib/api-client';

export function PublicHome({ communityId, onNavigate, theme }: DashboardProps) {
  // Set community context for API calls
  useEffect(() => {
    setCommunityContext(communityId);
  }, [communityId]);
  return (
    <div
      data-testid="dashboard-container"
      data-community-id={communityId}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">NFL Games</h1>
          <p className="text-muted-foreground">
            Live scores, schedules, and standings
          </p>
        </header>

        <nav className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => onNavigate('/community/nfl-games/public')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Scoreboard
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/public/standings')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Standings
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/public/schedule')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Schedule
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/public/teams')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Teams
          </button>
        </nav>

        <ScoreboardPage />
      </div>
    </div>
  );
}

export default PublicHome;
