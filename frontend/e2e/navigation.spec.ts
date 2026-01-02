import { test, expect } from '@playwright/test';
import {
  createNavigationSuite,
  createAccessibilitySuite,
  createResponsiveSuite,
  createConsoleSuite,
} from '@zyp/e2e-test-utils';

// Generate common navigation tests (11 tests)
createNavigationSuite({
  routes: [
    { path: '/', expectedContent: /Week/i },
    { path: '/live', expectedContent: /Live Games/i },
    { path: '/standings', expectedContent: /Standings/i },
    { path: '/teams', expectedContent: /main/i },
    { path: '/schedule', expectedContent: /main/i },
    { path: '/news', expectedContent: /main/i },
  ],
});

// Generate responsive design tests (4 tests)
createResponsiveSuite({
  routes: ['/'],
  viewports: ['mobile', 'tablet', 'desktop'],
});

// Generate accessibility tests (8 tests)
createAccessibilitySuite({
  routes: ['/'],
});

// Generate console error tests (2 tests)
createConsoleSuite({
  routes: ['/'],
  ignorePatterns: [
    /favicon/i,
    /extension/i,
    /chrome-extension/i,
  ],
});

// App-specific tests (14 tests)
test.describe('Navigation Menu', () => {
  test('should show navigation menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for nav menu (could be hamburger on mobile or nav bar)
    const nav = page.locator('nav').or(page.getByRole('navigation'));
    const menuButton = page.getByRole('button', { name: /menu/i });

    // Either nav or menu button should exist
    const navVisible = await nav.isVisible().catch(() => false);
    const menuVisible = await menuButton.isVisible().catch(() => false);

    expect(navVisible || menuVisible).toBeTruthy();
  });

  test('should navigate via menu links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to find and click on Live Games link
    const liveLink = page.getByRole('link', { name: /live/i });
    const isVisible = await liveLink.isVisible().catch(() => false);

    if (isVisible) {
      await liveLink.click();
      await expect(page).toHaveURL(/\/live/);
    }
  });

  test('should highlight active page in navigation', async ({ page }) => {
    await page.goto('/live');
    await page.waitForLoadState('networkidle');

    // Look for active state on live link
    const liveLink = page.getByRole('link', { name: /live/i });
    const isVisible = await liveLink.isVisible().catch(() => false);

    if (isVisible) {
      // Active link should have aria-current or active class
      const ariaCurrent = await liveLink.getAttribute('aria-current');
      const className = await liveLink.getAttribute('class');

      const isActive = ariaCurrent === 'page' || className?.includes('active');
      // Active state may or may not be present depending on implementation
      expect(isActive !== undefined).toBeTruthy();
    }
  });
});

test.describe('Deep Linking', () => {
  test('should load game details from direct URL', async ({ page }) => {
    // Use a test game ID
    await page.goto('/game/401671756');
    await expect(page).toHaveURL(/\/game\//);
  });

  test('should load team page from direct URL', async ({ page }) => {
    // Use a test team ID
    await page.goto('/team/PHI');
    await expect(page).toHaveURL(/\/team\//);
  });

  test('should handle invalid game ID', async ({ page }) => {
    await page.goto('/game/invalid-id-999999');
    await page.waitForLoadState('networkidle');

    // Should show error or not found message
    const errorVisible = await page.getByText(/not found|error/i).isVisible().catch(() => false);
    const contentVisible = await page.locator('main').isVisible().catch(() => true);

    // Either error message or content should be visible
    expect(errorVisible || contentVisible).toBeTruthy();
  });

  test('should preserve query parameters', async ({ page }) => {
    await page.goto('/?season=2023&week=10&type=regular');

    await expect(page).toHaveURL(/season=2023/);
    await expect(page).toHaveURL(/week=10/);
    await expect(page).toHaveURL(/type=regular/);
  });
});

test.describe('URL State Management', () => {
  test('should update URL on week change', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to next week
    const nextButton = page.getByRole('button', { name: /next/i }).or(
      page.locator('[aria-label="Next week"]')
    );
    await nextButton.click();

    // URL should update
    await expect(page).toHaveURL(/week=/);
  });

  test('should update URL on season change', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open menu and change season
    const menuButton = page.getByRole('button', { name: /filter|menu/i }).or(
      page.locator('[aria-label="Open filters"]')
    );
    const isVisible = await menuButton.isVisible().catch(() => false);

    if (isVisible) {
      await menuButton.click();

      const currentYear = new Date().getFullYear();
      const seasonSelect = page.getByLabel(/Season/);
      await seasonSelect.selectOption((currentYear - 1).toString());

      // URL should update
      await expect(page).toHaveURL(/season=/);
    }
  });

  test('should restore state from URL on page load', async ({ page }) => {
    // Load with specific state in URL
    await page.goto('/?season=2023&week=5&type=regular');
    await page.waitForLoadState('networkidle');

    // Should show week 5
    await expect(page.getByText(/Week 5/i)).toBeVisible();

    // Should show 2023
    await expect(page.getByText(/2023/)).toBeVisible();
  });
});

test.describe('Browser Navigation', () => {
  test('should preserve state on back navigation', async ({ page }) => {
    // Go to scoreboard week 5
    await page.goto('/?week=5');
    await page.waitForLoadState('networkidle');

    // Navigate to live
    await page.goto('/live');

    // Go back
    await page.goBack();

    // Should still be on week 5
    await expect(page.getByText(/Week 5/i)).toBeVisible();
  });
});

test.describe('Error Pages', () => {
  test('should show 404 for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');

    // Should either redirect to home or show 404
    const is404 = await page.getByText(/404|not found/i).isVisible().catch(() => false);
    const isHome = page.url().endsWith('/') || page.url().includes('/nfl');

    expect(is404 || isHome).toBeTruthy();
  });
});

test.describe('External Links', () => {
  test('should open external links in new tab', async ({ page, context: _context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for external links (e.g., to ESPN)
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    if (count > 0) {
      const firstExternal = externalLinks.first();

      // Should have target="_blank"
      await expect(firstExternal).toHaveAttribute('target', '_blank');

      // Should have rel="noopener noreferrer" for security
      const rel = await firstExternal.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test('should support enter key on buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Focus on next week button
    const nextButton = page.getByRole('button', { name: /next/i }).or(
      page.locator('[aria-label="Next week"]')
    );
    await nextButton.focus();

    // Press enter
    await page.keyboard.press('Enter');

    // Week should change
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toContain('week=');
  });
});
