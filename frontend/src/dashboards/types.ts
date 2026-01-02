/**
 * Dashboard Props - Contract between shell and SPA
 * Based on @zyp/spa-contract DashboardProps interface
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DashboardUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  role: { name: string; id?: string };
}

export interface CommunityTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  textMutedColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily?: string;
  headingFontFamily?: string;
  logoUrl?: string;
}

export interface DashboardProps {
  /** Current user (null if not authenticated) */
  user: DashboardUser | null;

  /** Navigation callback - shell handles actual routing */
  onNavigate: (path: string) => void;

  /** Current theme mode */
  theme: ThemeMode;

  /** Current community ID (for multi-tenant API calls) */
  communityId?: string;

  /** Community branding (optional) */
  communityTheme?: CommunityTheme;
}
