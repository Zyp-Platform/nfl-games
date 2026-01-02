/**
 * MemberHome - Dashboard for authenticated community members
 * Community SPA entry point for member access
 */

import { useEffect } from 'react';
import type { DashboardProps } from './types';
import { ScoreboardPage } from '../pages/ScoreboardPage';
import { setCommunityContext } from '../lib/api-client';

export function MemberHome({ communityId, user, onNavigate, theme }: DashboardProps) {
  // Set community context for API calls
  useEffect(() => {
    setCommunityContext(communityId);
  }, [communityId]);

  if (!user) {
    // Shell protects this route - redirect handled there
    return null;
  }

  return (
    <div
      data-testid="dashboard-container"
      data-community-id={communityId}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              NFL Games - Live scores, schedules, and standings
            </p>
          </div>
          <span
            data-testid="user-role-indicator"
            className="hidden"
          >
            {user.role.name}
          </span>
        </header>

        <nav className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => onNavigate('/community/nfl-games/member')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Scoreboard
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/member/live')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Live Games
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/member/standings')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Standings
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/member/schedule')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Schedule
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/member/teams')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Teams
          </button>
          <button
            onClick={() => onNavigate('/community/nfl-games/member/news')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            News
          </button>
        </nav>

        <ScoreboardPage />
      </div>
    </div>
  );
}

export default MemberHome;
