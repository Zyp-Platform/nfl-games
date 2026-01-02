/**
 * NFL Games SPA - App Component
 *
 * V1-Spec Compliant:
 * - Module Federation remote
 * - DashboardProps contract
 * - Multi-tenant context via communityId
 * - Shared React Router singleton
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { PublicHome, MemberHome, CommissionerHome } from './dashboards';
import type { DashboardProps } from './dashboards/types';
import { setCommunityContext } from './lib/api-client';

// Pages for internal routing
import { ScoreboardPage } from './pages/ScoreboardPage';
import { LiveGamesPage } from './pages/LiveGamesPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { TeamPage } from './pages/TeamPage';
import { TeamsPage } from './pages/TeamsPage';
import { StandingsPage } from './pages/StandingsPage';
import { SchedulePage } from './pages/SchedulePage';
import { NewsPage } from './pages/NewsPage';

/**
 * QueryClient configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * DashboardWrapper - Bridges shell context to dashboard components
 * Creates onNavigate from React Router's useNavigate hook
 */
interface DashboardWrapperProps {
  Dashboard: React.ComponentType<DashboardProps>;
  user: DashboardProps['user'];
  theme: DashboardProps['theme'];
  communityId?: string;
}

function DashboardWrapper({ Dashboard, user, theme, communityId }: DashboardWrapperProps) {
  const navigate = useNavigate();

  // Set community context for API calls
  useEffect(() => {
    setCommunityContext(communityId);
  }, [communityId]);

  // Bridge React Router to onNavigate prop
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Dashboard
      user={user}
      onNavigate={handleNavigate}
      theme={theme}
      communityId={communityId}
    />
  );
}

/**
 * StandaloneApp - Used for local development without shell
 * Includes BrowserRouter for standalone operation
 */
export function StandaloneApp() {
  // Mock user for standalone development
  const mockUser: DashboardProps['user'] = {
    id: 'dev-user-1',
    firstName: 'Dev',
    lastName: 'User',
    displayName: 'Dev User',
    email: 'dev@example.com',
    role: { name: 'member' },
  };

  const mockCommunityId = 'dev-community-1';

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/community/nfl-games/public"
            element={
              <DashboardWrapper
                Dashboard={PublicHome}
                user={null}
                theme="light"
                communityId={mockCommunityId}
              />
            }
          />
          <Route
            path="/community/nfl-games/public/*"
            element={
              <DashboardWrapper
                Dashboard={PublicHome}
                user={null}
                theme="light"
                communityId={mockCommunityId}
              />
            }
          />

          {/* Member routes */}
          <Route
            path="/community/nfl-games/member"
            element={
              <DashboardWrapper
                Dashboard={MemberHome}
                user={mockUser}
                theme="light"
                communityId={mockCommunityId}
              />
            }
          />
          <Route
            path="/community/nfl-games/member/*"
            element={
              <DashboardWrapper
                Dashboard={MemberHome}
                user={mockUser}
                theme="light"
                communityId={mockCommunityId}
              />
            }
          />

          {/* Commissioner routes */}
          <Route
            path="/community/nfl-games/commissioner"
            element={
              <DashboardWrapper
                Dashboard={CommissionerHome}
                user={{ ...mockUser, role: { name: 'commissioner' } }}
                theme="light"
                communityId={mockCommunityId}
              />
            }
          />
          <Route
            path="/community/nfl-games/commissioner/*"
            element={
              <DashboardWrapper
                Dashboard={CommissionerHome}
                user={{ ...mockUser, role: { name: 'commissioner' } }}
                theme="light"
                communityId={mockCommunityId}
              />
            }
          />

          {/* Legacy routes (redirect to new structure) */}
          <Route path="/" element={<LegacyRedirect to="/community/nfl-games/public" />} />
          <Route path="/standings" element={<LegacyRedirect to="/community/nfl-games/public/standings" />} />
          <Route path="/teams" element={<LegacyRedirect to="/community/nfl-games/public/teams" />} />
          <Route path="/schedule" element={<LegacyRedirect to="/community/nfl-games/public/schedule" />} />
          <Route path="/live" element={<LegacyRedirect to="/community/nfl-games/member/live" />} />
          <Route path="/news" element={<LegacyRedirect to="/community/nfl-games/member/news" />} />
          <Route path="/game/:gameId" element={<LegacyRedirect to="/community/nfl-games/public/game/:gameId" />} />
          <Route path="/team/:teamId" element={<LegacyRedirect to="/community/nfl-games/public/team/:teamId" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * LegacyRedirect - Redirects old routes to new V1 structure
 */
function LegacyRedirect({ to }: { to: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Preserve path params by replacing :param with actual values
    let targetPath = to;
    const pathParts = location.pathname.split('/');

    if (to.includes(':gameId')) {
      const gameId = pathParts.find((_, i) => pathParts[i - 1] === 'game');
      if (gameId) targetPath = to.replace(':gameId', gameId);
    }

    if (to.includes(':teamId')) {
      const teamId = pathParts.find((_, i) => pathParts[i - 1] === 'team');
      if (teamId) targetPath = to.replace(':teamId', teamId);
    }

    navigate(targetPath, { replace: true });
  }, [navigate, to, location.pathname]);

  return null;
}

// Default export for Module Federation
export default StandaloneApp;
