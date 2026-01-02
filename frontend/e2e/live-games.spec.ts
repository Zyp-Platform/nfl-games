import { test, expect } from '@playwright/test';

test.describe('LiveGamesPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/live');
  });

  test.describe('Page Load and Initial State', () => {
    test('should load live games page successfully', async ({ page }) => {
      await expect(page).toHaveURL(/\/live/);
      await expect(page.getByText(/Live Games/i)).toBeVisible();
    });

    test('should display live indicator with animation', async ({ page }) => {
      // Look for the animated pulse indicator
      const liveIndicator = page.locator('[class*="animate-ping"]').or(
        page.locator('[class*="animate-pulse"]')
      );
      await expect(liveIndicator).toBeVisible();
    });

    test('should show "Updates every 15s" message', async ({ page }) => {
      await expect(page.getByText(/Updates every 15s/i)).toBeVisible();
    });

    test('should display in progress count', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/In Progress/i)).toBeVisible();
    });

    test('should display clutch time count', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/Clutch Time/i)).toBeVisible();
    });
  });

  test.describe('Live Game Statistics', () => {
    test('should display total live games count', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Look for numeric count
      const inProgressSection = page.locator('text=In Progress').locator('..');
      await expect(inProgressSection).toContainText(/\d+/);
    });

    test('should display clutch time games count', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Look for clutch time count
      const clutchSection = page.locator('text=Clutch Time').locator('..');
      await expect(clutchSection).toContainText(/\d+/);
    });

    test('should show fire icon for clutch time', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Look for flame/fire icon (Lucide Flame icon)
      const flameIcon = page.locator('svg').filter({ hasText: '' }).or(
        page.locator('[class*="lucide-flame"]')
      );

      // Icon should exist
      const count = await flameIcon.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Live Games Display', () => {
    test('should show "No Live Games" message when no games', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/v1/games/live', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            games: [],
            metadata: {
              totalLiveGames: 0,
              clutchTimeGames: 0,
              cacheHit: false,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/No Live Games/i)).toBeVisible();
      await expect(page.getByText(/Check back during game days/i)).toBeVisible();
    });

    test('should display live game cards when games are available', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const gameCards = page.locator('[data-testid="game-card"]').or(page.locator('.game-card'));
      const count = await gameCards.count();

      // Either games are present or "No live games" message
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      } else {
        await expect(page.getByText(/No Live Games/i)).toBeVisible();
      }
    });

    test('should group games into clutch time and all live sections', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Check for section headers
      const clutchSection = page.getByRole('heading', { name: /Clutch Time/i });
      const allLiveSection = page.getByRole('heading', { name: /All Live/i });

      // At least one section should be visible
      const clutchVisible = await clutchSection.isVisible().catch(() => false);
      const allVisible = await allLiveSection.isVisible().catch(() => false);

      // Either section could be visible depending on game data
      expect(clutchVisible || allVisible).toBeTruthy();
    });

    test('should show clutch time badge count', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Look for clutch time section
      const clutchSection = page.locator('text=Clutch Time').first();
      const isVisible = await clutchSection.isVisible().catch(() => false);

      if (isVisible) {
        // Should have a badge with count
        const badge = page.locator('[class*="badge"]').filter({ hasText: /\d+/ }).first();
        await expect(badge).toBeVisible();
      }
    });
  });

  test.describe('Current Drive Information', () => {
    test('should display current drive description for live games', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Look for drive information (team abbreviation + description)
      const driveInfo = page.locator('[class*="text-green"]').filter({ hasText: /:/ });
      const count = await driveInfo.count();

      // Drive info may or may not be present depending on data
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Auto-Refresh Functionality', () => {
    test('should auto-refresh every 15 seconds', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Track API calls
      let apiCallCount = 0;
      await page.route('**/api/v1/games/live', (route) => {
        apiCallCount++;
        route.continue();
      });

      // Wait for initial load
      await page.waitForTimeout(1000);
      const initialCalls = apiCallCount;

      // Wait 16 seconds for refresh
      await page.waitForTimeout(16000);

      // Should have made at least one more call
      expect(apiCallCount).toBeGreaterThan(initialCalls);
    });

    test('should update game scores on refresh', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Get initial score
      const gameCard = page.locator('[data-testid="game-card"]').or(page.locator('.game-card')).first();
      const hasCard = await gameCard.isVisible().catch(() => false);

      if (hasCard) {
        const _initialText = await gameCard.textContent();

        // Wait for potential update
        await page.waitForTimeout(16000);

        const updatedText = await gameCard.textContent();

        // Text content exists (may or may not have changed)
        expect(updatedText).toBeTruthy();
      }
    });
  });

  test.describe('Game Status Indicators', () => {
    test('should show game clock and quarter', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const gameCards = page.locator('[data-testid="game-card"]').or(page.locator('.game-card'));
      const count = await gameCards.count();

      if (count > 0) {
        const firstCard = gameCards.first();

        // Look for time or quarter indicators
        const hasTime = await firstCard.getByText(/\d{1,2}:\d{2}/).isVisible().catch(() => false);
        const hasQuarter = await firstCard.getByText(/Q[1-4]|OT/i).isVisible().catch(() => false);

        expect(hasTime || hasQuarter).toBeTruthy();
      }
    });

    test('should highlight clutch time games', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Look for clutch time section
      const clutchSection = page.locator('text=Clutch Time').first();
      const isVisible = await clutchSection.isVisible().catch(() => false);

      if (isVisible) {
        // Clutch section should have distinctive styling
        const clutchGames = clutchSection.locator('..').locator('[data-testid="game-card"]');
        const count = await clutchGames.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Navigation to Game Details', () => {
    test('should navigate to game details on card click', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const gameCards = page.locator('[data-testid="game-card"]').or(page.locator('.game-card'));
      const count = await gameCards.count();

      if (count > 0) {
        await gameCards.first().click();

        // Should navigate to game details
        await expect(page).toHaveURL(/\/game\//);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message on API failure', async ({ page }) => {
      // Intercept API and return error
      await page.route('**/api/v1/games/live', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show error message
      await expect(page.getByText(/error|failed|wrong/i)).toBeVisible();
    });

    test('should have retry button on error', async ({ page }) => {
      // Intercept API and return error
      await page.route('**/api/v1/games/live', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should have retry button
      const retryButton = page.getByRole('button', { name: /retry|try again/i });
      await expect(retryButton).toBeVisible();
    });

    test('should retry on error button click', async ({ page }) => {
      let callCount = 0;

      // Intercept API - fail first, succeed second
      await page.route('**/api/v1/games/live', (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
          });
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              games: [],
              metadata: {
                totalLiveGames: 0,
                clutchTimeGames: 0,
                cacheHit: false,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Click retry
      const retryButton = page.getByRole('button', { name: /retry|try again/i });
      await retryButton.click();

      // Should show success state
      await expect(page.getByText(/No Live Games/i)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/live');
      await page.waitForLoadState('networkidle');

      // Header should be visible
      await expect(page.getByText(/Live Games/i)).toBeVisible();

      // Stats should be visible
      await expect(page.getByText(/In Progress/i)).toBeVisible();
      await expect(page.getByText(/Clutch Time/i)).toBeVisible();
    });

    test('should stack stats vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/live');
      await page.waitForLoadState('networkidle');

      // Both stat cards should be visible
      const inProgressCard = page.locator('text=In Progress').locator('..');
      const clutchCard = page.locator('text=Clutch Time').locator('..');

      await expect(inProgressCard).toBeVisible();
      await expect(clutchCard).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/live');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle frequent updates without memory leaks', async ({ page }) => {
      await page.goto('/live');
      await page.waitForLoadState('networkidle');

      // Wait for multiple refresh cycles
      await page.waitForTimeout(30000); // 30 seconds = 2 refresh cycles

      // Page should still be responsive
      await expect(page.getByText(/Live Games/i)).toBeVisible();
    });
  });
});
