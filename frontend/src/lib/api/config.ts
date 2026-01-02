/**
 * API Configuration
 * Phase 2.8: Frontend-Backend API Integration
 *
 * Centralized configuration for API endpoints and behavior
 */

/**
 * API connection settings
 */
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3005/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second base delay
  retryBackoffMultiplier: 2, // Exponential backoff
} as const;

/**
 * Query cache configuration
 */
export const QUERY_CONFIG = {
  gameListCache: 1 * 60 * 60 * 1000, // 1 hour
  defaultStaleTime: 2 * 60 * 1000, // 2 minutes
  defaultGcTime: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_CONFIG = {
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 1,
} as const;

/**
 * Get API base URL with fallback
 */
export function getAPIBaseURL(): string {
  return API_CONFIG.baseURL;
}

/**
 * Get full API endpoint URL
 */
export function getAPIEndpoint(path: string): string {
  const baseURL = getAPIBaseURL();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}${cleanPath}`;
}

/**
 * Environment configuration
 */
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL,
  userCoreUrl: import.meta.env.VITE_USER_CORE_URL,
  userChatUrl: import.meta.env.VITE_USER_CHAT_URL,
  userCreditUrl: import.meta.env.VITE_USER_CREDIT_URL,
  nflGamesUrl: import.meta.env.VITE_NFL_GAMES_URL,
} as const;
