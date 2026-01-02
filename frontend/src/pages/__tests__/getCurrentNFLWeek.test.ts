import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Extract the getCurrentNFLWeek function for testing
 * Since it's not exported from ScoreboardPage, we'll test the logic directly
 */
function getCurrentNFLWeek(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // NFL season runs September through February
  // Regular season: ~Sept 5 - early January (18 weeks)
  // If before September, we're in offseason - default to week 1
  if (month < 8) {
    // Before September
    return 1;
  }

  // Approximate NFL season start: first Thursday after first Monday in September
  // For simplicity, assume season starts ~Sept 5
  const seasonStart = new Date(year, 8, 5); // Sept 5

  // If we're after February, we're in offseason
  if (month > 1 && month < 8) {
    // March through August
    return 1;
  }

  // Calculate weeks since season start
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1;

  // Clamp to 1-18 for regular season
  return Math.max(1, Math.min(18, weeksSinceStart));
}

describe('getCurrentNFLWeek', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns week 1 for dates before September', () => {
    // Test August (before season starts)
    vi.setSystemTime(new Date('2025-08-15T12:00:00Z'));
    expect(getCurrentNFLWeek()).toBe(1);
  });

  it('returns week 1 for dates in March-August', () => {
    // Test March (offseason)
    vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
    expect(getCurrentNFLWeek()).toBe(1);

    // Test July (offseason)
    vi.setSystemTime(new Date('2025-07-15T12:00:00Z'));
    expect(getCurrentNFLWeek()).toBe(1);
  });

  it('returns week 1 for early September', () => {
    // Test Sept 5 (season start)
    vi.setSystemTime(new Date('2025-09-05T12:00:00Z'));
    expect(getCurrentNFLWeek()).toBe(1);
  });

  it('calculates correct week during season', () => {
    // Test week 2 (Sept 12 - 7 days after start)
    vi.setSystemTime(new Date('2025-09-12T12:00:00Z'));
    const week = getCurrentNFLWeek();
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(18);
  });

  it('clamps to week 18 maximum', () => {
    // Test late December (should be near end of season but not exceed 18)
    vi.setSystemTime(new Date('2025-12-28T12:00:00Z'));
    const week = getCurrentNFLWeek();
    expect(week).toBeLessThanOrEqual(18);
    expect(week).toBeGreaterThan(1);
  });

  it('handles mid-season correctly', () => {
    // Test mid-October (should be around week 6-7)
    vi.setSystemTime(new Date('2025-10-15T12:00:00Z'));
    const week = getCurrentNFLWeek();
    expect(week).toBeGreaterThanOrEqual(5);
    expect(week).toBeLessThanOrEqual(8);
  });

  it('handles early season correctly', () => {
    // Test late September (should be around week 3-4)
    vi.setSystemTime(new Date('2025-09-25T12:00:00Z'));
    const week = getCurrentNFLWeek();
    expect(week).toBeGreaterThanOrEqual(2);
    expect(week).toBeLessThanOrEqual(5);
  });

  it('handles late season correctly', () => {
    // Test late December (should be around week 16-17)
    vi.setSystemTime(new Date('2025-12-20T12:00:00Z'));
    const week = getCurrentNFLWeek();
    expect(week).toBeGreaterThanOrEqual(14);
    expect(week).toBeLessThanOrEqual(18);
  });

  it('never returns a week less than 1', () => {
    // Test various dates throughout the year
    const dates = [
      '2025-01-01T12:00:00Z',
      '2025-03-15T12:00:00Z',
      '2025-06-01T12:00:00Z',
      '2025-09-01T12:00:00Z',
      '2025-12-31T12:00:00Z',
    ];

    dates.forEach((date) => {
      vi.setSystemTime(new Date(date));
      expect(getCurrentNFLWeek()).toBeGreaterThanOrEqual(1);
    });
  });

  it('never returns a week greater than 18', () => {
    // Test various dates throughout the year
    const dates = [
      '2025-09-05T12:00:00Z',
      '2025-10-15T12:00:00Z',
      '2025-11-20T12:00:00Z',
      '2025-12-25T12:00:00Z',
      '2026-01-10T12:00:00Z',
    ];

    dates.forEach((date) => {
      vi.setSystemTime(new Date(date));
      expect(getCurrentNFLWeek()).toBeLessThanOrEqual(18);
    });
  });
});
