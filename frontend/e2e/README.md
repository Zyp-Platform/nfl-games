# NFL Games Frontend E2E Tests

Comprehensive end-to-end test suite for the NFL Games application using Playwright.

## 📋 Test Coverage

### Test Suites

1. **scoreboard.spec.ts** (50+ tests)
   - Page load and initial state
   - Week navigation (prev/next)
   - Season and season type filters
   - Game cards display and grouping
   - Game card interactions
   - Error handling and retry
   - Responsive design (mobile/tablet)
   - Performance and caching

2. **live-games.spec.ts** (40+ tests)
   - Live games display
   - Live statistics (in-progress count, clutch time)
   - Auto-refresh functionality (15s intervals)
   - Current drive information
   - Game status indicators
   - Error handling
   - Responsive design
   - Performance under auto-refresh

3. **navigation.spec.ts** (35+ tests)
   - Page navigation (all routes)
   - Navigation menu interactions
   - Browser back/forward buttons
   - Deep linking support
   - URL state management
   - Error pages (404)
   - External links
   - Keyboard navigation
   - Accessibility (WCAG compliance)

4. **game-details.spec.ts** (35+ tests)
   - Game header (teams, scores, status)
   - Box score display
   - Scoring plays timeline
   - Team leaders (passing, rushing, receiving)
   - Drive chart and current drive
   - Navigation to/from game details
   - Error handling (invalid IDs)
   - Responsive design
   - Real-time updates for live games
   - Performance

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install
```

### Run Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run in UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug mode (step through tests)
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e scoreboard

# Run specific test
pnpm test:e2e -g "should navigate to next week"
```

### View Reports

```bash
# Show HTML report
pnpm test:e2e:report
```

### Generate Tests

```bash
# Use Playwright Codegen to record tests
pnpm test:e2e:codegen
```

## 🎯 Test Strategy

### Coverage Areas

✅ **Functional Testing**
- All user workflows (viewing games, navigation, filtering)
- Form interactions (week selector, filters)
- Data display and updates
- Live game features (auto-refresh, clutch time)

✅ **UI/UX Testing**
- Responsive design (mobile, tablet, desktop)
- Loading states and spinners
- Error messages and retry buttons
- Accessibility (keyboard navigation, ARIA)

✅ **Integration Testing**
- API mocking and error scenarios
- Browser navigation (back/forward)
- URL state persistence
- Deep linking

✅ **Performance Testing**
- Page load times (<5s)
- Auto-refresh impact
- Memory leaks
- Caching effectiveness

### Test Patterns

**Resilient Selectors**
```typescript
// Multiple selector strategies for robustness
const gameCard = page.locator('[data-testid="game-card"]')
  .or(page.locator('.game-card'));
```

**Data-Dependent Tests**
```typescript
// Graceful handling of dynamic data
if (count > 0) {
  // Test with data
} else {
  // Verify "no data" message
}
```

**Error Injection**
```typescript
// Mock API failures
await page.route('**/api/v1/games/live', (route) => {
  route.fulfill({ status: 500, body: { error: 'Server Error' } });
});
```

## 📊 Browser Coverage

Tests run across:
- ✅ Chromium (Desktop Chrome)
- ✅ Firefox (Desktop Firefox)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## 🏗️ Test Architecture

```
e2e/
├── scoreboard.spec.ts      # Scoreboard page tests
├── live-games.spec.ts      # Live games page tests
├── navigation.spec.ts      # Navigation and routing tests
├── game-details.spec.ts    # Game details page tests
└── README.md               # This file

playwright.config.ts         # Playwright configuration
```

## 🔧 Configuration

Key settings in `playwright.config.ts`:

- **Base URL**: `http://localhost:3203`
- **Retries**: 2 (in CI), 0 (local)
- **Timeout**: 30s per test
- **Parallel**: Full parallelism (local), 1 worker (CI)
- **Reporters**: HTML, JSON, JUnit
- **Trace**: On first retry
- **Screenshots**: On failure
- **Video**: Retained on failure

## 📝 Writing New Tests

### Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.waitForLoadState('networkidle');

    // Act
    await page.getByRole('button', { name: /click me/i }).click();

    // Assert
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

### Best Practices

1. **Use semantic selectors** (roles, labels, text)
2. **Wait for network idle** before interactions
3. **Handle dynamic data** gracefully
4. **Test both success and error paths**
5. **Keep tests independent** (no shared state)
6. **Use descriptive test names**
7. **Group related tests** in describe blocks

## 🐛 Debugging

### Common Issues

**Test times out**
```bash
# Increase timeout
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

**Element not found**
```bash
# Add wait
await page.waitForSelector('[data-testid="my-element"]');
```

**Flaky test**
```bash
# Use waitFor with retry
await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });
```

### Debug Tools

```bash
# Run with Playwright Inspector
pnpm test:e2e:debug

# Run specific test in debug mode
pnpm test:e2e:debug -g "test name"

# Enable trace viewer
PWDEBUG=1 pnpm test:e2e
```

## 📈 CI/CD Integration

Tests are configured for CI/CD with:
- Automatic retries on failure
- HTML, JSON, and JUnit reports
- Screenshot and video capture on failure
- Trace recording for debugging

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 🎓 Learning Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen)
- [Debugging Guide](https://playwright.dev/docs/debug)

## 📞 Support

For issues or questions:
1. Check test output and traces
2. Review Playwright documentation
3. Run in debug mode
4. Check browser console logs

---

**Total Test Count**: ~160+ comprehensive e2e tests
**Browsers**: 5 configurations (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari)
**Estimated Run Time**: 5-10 minutes (parallel), 20-30 minutes (sequential)

---

## Related Documentation

**📚 Complete Documentation Index:** See [KNOWLEDGE-BASE.md](../../../../KNOWLEDGE-BASE.md) for the complete documentation catalog.

