/**
 * Central type definitions for NFL Games frontend
 * Re-exports from specialized type files
 */

// Re-export all API types
export * from './api';

/**
 * User object from session
 */
export interface SessionUser {
    id: string;
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role?: string;
    [key: string]: unknown;
}

/**
 * Session state type
 */
export interface SessionState {
    user?: SessionUser;
    isAuthenticated?: boolean;
    [key: string]: unknown;
}

/**
 * AuthContextValue defines the shape of the authentication context
 * Used to provide auth state and methods to consuming components
 */
export interface AuthContextValue {
  /**
   * Current authentication session
   * Null if user is not authenticated
   */
  session: SessionState | null;

  /**
   * Whether auth context is being initialized
   * True during initial auth check or session restoration
   */
  isInitializing: boolean;

  /**
   * Whether auth operation is in progress
   * True during login/logout/refresh
   */
  isLoading: boolean;

  /**
   * Error from last auth operation (if any)
   */
  error: Error | null;

  /**
   * Authenticate user with email and password
   *
   * @param email User email address
   * @param password User password (plain text, sent over HTTPS)
   * @throws AuthError if authentication fails
   */
  login: (email: string, password: string) => Promise<void>;

  /**
   * Logout current user and clear session
   * Clears stored tokens and session data
   */
  logout: () => void;

  /**
   * Refresh the current session
   * Fetches new access token using refresh token
   *
   * @throws Error if refresh fails or refresh token is expired
   */
  refreshSession: () => Promise<void>;

  /**
   * Check if user has specific permission
   * Handles wildcard permissions and admin bypass
   *
   * @param permission Permission to check (e.g., "user:view")
   * @returns true if user has permission
   */
  hasPermission: (permission: string) => boolean;

  /**
   * Check if user has ANY of the provided permissions
   *
   * @param permissions Array of permission strings
   * @returns true if user has at least one permission
   */
  hasAnyPermission: (permissions: string[]) => boolean;

  /**
   * Check if user has ALL of the provided permissions
   *
   * @param permissions Array of permission strings
   * @returns true if user has all permissions
   */
  hasAllPermissions: (permissions: string[]) => boolean;

  /**
   * Check if user has specific role
   *
   * @param role Role to check ('user' | 'admin')
   * @returns true if user has this role
   */
  hasRole: (role: 'user' | 'admin') => boolean;

  /**
   * Check if user account is blocked
   *
   * @returns true if user is blocked/suspended
   */
  isBlocked: () => boolean;

  /**
   * Check if user is authenticated
   *
   * @returns true if session exists and user is not blocked
   */
  isAuthenticated: () => boolean;

  /**
   * Check if current session has expired
   *
   * @returns true if session time is past expiresAt
   */
  isSessionExpired: () => boolean;

  /**
   * Check if user is admin (backward compatible)
   * @deprecated Use hasRole('admin') instead
   */
  isAdmin: () => boolean;

  /**
   * Check if user is regular user (backward compatible)
   * @deprecated Use hasRole('user') instead
   */
  isUser: () => boolean;
}

/**
 * Props for AuthProvider component
 */
export interface AuthProviderProps {
  /**
   * Child components to wrap
   */
  children: React.ReactNode;

  /**
   * Callback when session expires
   */
  onSessionExpired?: () => void;

  /**
   * Callback when authentication fails
   */
  onAuthError?: (error: Error) => void;

  /**
   * Initial auth state (optional, for testing)
   */
  initialSession?: SessionState | null;
}
