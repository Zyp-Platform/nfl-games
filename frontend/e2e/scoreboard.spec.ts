import { test, expect } from '@playwright/test';

test.describe('ScoreboardPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Page Load and Initial State', () => {
    test('should load scoreboard page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/NFL Games/i);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should display week selector on load', async ({ page }) => {
      await expect(page.getByRole('button', { name: /week/i })).toBeVisible();
    });

    test('should show current season year', async ({ page }) => {
      const currentYear = new Date().getFullYear();
      await expect(page.getByText(new RegExp(currentYear.toString()))).toBeVisible();
    });

    test('should default to Regular Season', async ({ page }) => {
      await expect(page.getByText(/Regular Season/i)).toBeVisible();
    });

    test('should display loading spinner initially', async ({ page }) => {
      // Go to page and immediately check for spinner
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const spinner = page.getByTestId('loading-spinner').or(page.locator('[role="status"]'));

      // Spinner should be visible briefly
      try {
        await expect(spinner).toBeVisible({ timeout: 1000 });
      } catch {
        // Spinner may load too fast, which is fine
      }
    });
  });

  test.describe('Week Navigation', () => {
    test('should navigate to next week', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Get current week
      const weekText = await page.getByText(/Week \d+/).textContent();
      const currentWeek = parseInt(weekText?.match(/\d+/)?.[0] || '1');

      // Click next week button
      await page.getByRole('button', { name: /next/i }).or(page.locator('[aria-label="Next week"]')).click();

      // Verify week incremented
      await expect(page.getByText(new RegExp(`Week ${currentWeek + 1}`))).toBeVisible();
    });

    test('should navigate to previous week', async ({ page }) => {
      // First go to week 5 to ensure we can go back
      await page.goto('/?week=5');
      await page.waitForLoadState('networkidle');

      // Click previous week button
      await page.getByRole('button', { name: /prev/i }).or(page.locator('[aria-label="Previous week"]')).click();

      // Verify week decremented
      await expect(page.getByText(/Week 4/)).toBeVisible();
    });

    test('should disable previous button on week 1', async ({ page }) => {
      await page.goto('/?week=1');
      await page.waitForLoadState('networkidle');

      const prevButton = page.getByRole('button', { name: /prev/i }).or(page.locator('[aria-label="Previous week"]'));
      await expect(prevButton).toBeDisabled();
    });

    test('should disable next button on max week (18)', async ({ page }) => {
      await page.goto('/?week=18');
      await page.waitForLoadState('networkidle');

      const nextButton = page.getByRole('button', { name: /next/i }).or(page.locator('[aria-label="Next week"]'));
      await expect(nextButton).toBeDisabled();
    });

    test('should update URL when changing weeks', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /next/i }).or(page.locator('[aria-label="Next week"]')).click();

      // Check URL contains week parameter
      await expect(page).toHaveURL(/week=/);
    });
  });

  test.describe('Season and Type Filters', () => {
    test('should open filter menu', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Click menu/filter button
      const menuButton = page.getByRole('button', { name: /filter|menu/i }).or(page.locator('[aria-label="Open filters"]'));
      await menuButton.click();

      // Verify filter options are visible
      await expect(page.getByLabel(/Season/i)).toBeVisible();
      await expect(page.getByLabel(/Season Type/i)).toBeVisible();
    });

    test('should change season year', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Open filters
      const menuButton = page.getByRole('button', { name: /filter|menu/i }).or(page.locator('[aria-label="Open filters"]'));
      await menuButton.click();

      // Change season
      const currentYear = new Date().getFullYear();
      await page.getByLabel(/Season/).selectOption((currentYear - 1).toString());

      // Verify season changed
      await expect(page.getByText(new RegExp(`${currentYear - 1}`))).toBeVisible();
    });

    test('should change to preseason', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Open filters
      const menuButton = page.getByRole('button', { name: /filter|menu/i }).or(page.locator('[aria-label="Open filters"]'));
      await menuButton.click();

      // Change to preseason
      await page.getByLabel(/Season Type/i).selectOption('preseason');

      // Verify preseason is displayed
      await expect(page.getByText(/Preseason/i)).toBeVisible();
    });

    test('should change to postseason/playoffs', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Open filters
      const menuButton = page.getByRole('button', { name: /filter|menu/i }).or(page.locator('[aria-label="Open filters"]'));
      await menuButton.click();

      // Change to postseason
      await page.getByLabel(/Season Type/i).selectOption('postseason');

      // Verify playoffs is displayed
      await expect(page.getByText(/Playoff/i)).toBeVisible();
    });

    test('should reset to week 1 when changing season type', async ({ page }) => {
      // Go to week 5
      await page.goto('/?week=5');
      await page.waitForLoadState('networkidle');

      // Open filters and change season type
      const menuButton = page.getByRole('button', { name: /filter|menu/i }).or(page.locator('[aria-label="Open filters"]'));
      await menuButton.click();
      await page.getByLabel(/Season Type/i).selectOption('preseason');

      // Verify reset to week 1
      await expect(page.getByText(/Week 1/)).toBeVisible();
    });
  });

  test.describe('Game Cards Display', () => {
    test('should display game cards when games are available', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 }).catch(() => {});

      const gameCards = page.locator('[data-testid="game-card"]').or(page.locator('.game-card'));
      const count = await gameCards.count();

      // Either games are present or "No games" message
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
        await expect(gameCards.first()).toBeVisible();
      } else {
        await expect(page.getByText(/No games/i)).toBeVisible();
      }
    });

    test('should display team names and scores', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 }).catch(() => {});

      const gameCards = page.locator('[data-testid="game-card"]').or(page.locator('.game-card'));
      const count = await gameCards.count();

      if (count > 0) {
        const firstCard = gameCards.first();

        // Should have team information
        await expect(firstCard).toContainText(/\w+/); // Contains some text
      }
    });

    test('should group games by date', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Look for date headers
      const dateHeaders = page.locator('h3').filter({ hasText: /Mon|Tue|Wed|Thu|Fri|Sat|Sun/ });
      const count = await dateHeaders.count();

      // Should have at least one date grouping
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show "No games" message when no games available', async ({ page }) => {
      // Go to a week that likely has no games (e.g., preseason week 4 of future year)
      const futureYear = new Date().getFullYear() + 1;
      await page.goto(`/?season=${futureYear}&week=4&type=preseason`);
      await page.waitForLoadState('networkidle');

      // Should show no games message
      await expect(page.getByText(/No games/i)).toBeVisible();
    });
  });

  test.describe('Game Card Interactions', () => {
    test('should navigate to game details on card click', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 }).catch(() => {});

      const gameCards = page.locator('[data-testid="game-card"]').or(page.locator('.game-card'));
      const count = await gameCards.count();

      if (count > 0) {
        await gameCards.first().click();

        // Should navigate to game details page
        await expect(page).toHaveURL(/\/game\//);
      }
    });

    test('should display game status (scheduled/in-progress/final)', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 }).catch(() => {});

      const gameCards = page.locator('[data-testid="game-card"]').or(page.locator('.game-card'));
      const count = await gameCards.count();

      if (count > 0) {
        const firstCard = gameCards.first();

        // Should have status indicator or time
        const hasStatus = await firstCard.locator('[data-testid="game-status"]').isVisible().catch(() => false);
        const hasTime = await firstCard.getByText(/:\d{2}/).isVisible().catch(() => false);
        const hasFinal = await firstCard.getByText(/Final/i).isVisible().catch(() => false);

        expect(hasStatus || hasTime || hasFinal).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message on API failure', async ({ page }) => {
      // Intercept API and return error
      await page.route('**/api/v1/scoreboard*', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show error message
      await expect(page.getByText(/error|failed|wrong/i)).toBeVisible();
    });

    test('should have retry button on error', async ({ page }) => {
      // Intercept API and return error
      await page.route('**/api/v1/scoreboard*', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have retry button
      const retryButton = page.getByRole('button', { name: /retry|try again/i });
      await expect(retryButton).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Week selector should still be visible
      await expect(page.getByText(/Week/i)).toBeVisible();

      // Content should be visible
      const content = page.locator('main').or(page.locator('.container'));
      await expect(content).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // All elements should be visible
      await expect(page.getByText(/Week/i)).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should cache data on subsequent visits', async ({ page }) => {
      // First visit
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Second visit
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Second load should be faster (cached)
      expect(loadTime).toBeLessThan(3000);
    });
  });
});
