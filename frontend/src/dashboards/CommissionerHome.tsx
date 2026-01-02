/**
 * CommissionerHome - Admin dashboard for community commissioners
 * Community SPA entry point for commissioner/admin access
 */

import { useEffect } from 'react';
import type { DashboardProps } from './types';
import { setCommunityContext } from '../lib/api-client';

export function CommissionerHome({ communityId, user, onNavigate, theme }: DashboardProps) {
  // Set community context for API calls
  useEffect(() => {
    setCommunityContext(communityId);
  }, [communityId]);

  if (!user || user.role.name !== 'commissioner') {
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
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            NFL Games Administration
          </h1>
          <p className="text-muted-foreground">
            Community: {communityId}
          </p>
          <p className="text-muted-foreground">
            Admin: {user.displayName}
          </p>
          <span
            data-testid="user-role-indicator"
            className="hidden"
          >
            {user.role.name}
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Cards */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-2">Community Settings</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Configure NFL Games settings for this community
            </p>
            <button
              onClick={() => onNavigate('/community/nfl-games/commissioner/settings')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Manage Settings
            </button>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-2">Featured Games</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Highlight specific games for community members
            </p>
            <button
              onClick={() => onNavigate('/community/nfl-games/commissioner/featured')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Manage Featured
            </button>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-2">Analytics</h2>
            <p className="text-muted-foreground text-sm mb-4">
              View usage statistics and engagement metrics
            </p>
            <button
              onClick={() => onNavigate('/community/nfl-games/commissioner/analytics')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              View Analytics
            </button>
          </div>
        </div>

        <nav className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Quick Links</h3>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => onNavigate('/community/nfl-games/member')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
            >
              View as Member
            </button>
            <button
              onClick={() => onNavigate('/community/nfl-games/public')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
            >
              View Public Page
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default CommissionerHome;
