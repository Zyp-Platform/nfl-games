/**
 * Game Status Value Object
 * Represents the current state of a game
 */
export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  PREGAME = 'PREGAME',
  IN_PROGRESS = 'IN_PROGRESS',
  HALFTIME = 'HALFTIME',
  FINAL = 'FINAL',
  FINAL_OVERTIME = 'FINAL_OVERTIME',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  DELAYED = 'DELAYED',
}

/**
 * Type guard to check if a string is a valid GameStatus
 */
export function isGameStatus(value: string): value is GameStatus {
  return Object.values(GameStatus).includes(value as GameStatus);
}

/**
 * Helper to determine if a game is currently live
 */
export function isLiveStatus(status: GameStatus): boolean {
  return status === GameStatus.IN_PROGRESS || status === GameStatus.HALFTIME;
}

/**
 * Helper to determine if a game is completed
 */
export function isCompletedStatus(status: GameStatus): boolean {
  return status === GameStatus.FINAL || status === GameStatus.FINAL_OVERTIME;
}

/**
 * Helper to determine if a game is scheduled to happen
 */
export function isUpcomingStatus(status: GameStatus): boolean {
  return status === GameStatus.SCHEDULED || status === GameStatus.PREGAME;
}
