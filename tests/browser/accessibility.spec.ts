import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installPublicRoutes } from './fixtures.js';

const adminUrl = process.env.NW_ADMIN_BASE_URL ?? 'http://127.0.0.1:4174/admin/';

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''))).toEqual([]);
}

async function exerciseFirstKeyboardTarget(page: Page) {
  const focusable = page.locator('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
  const count = await focusable.count();
  await page.keyboard.press('Tab');
  if (count > 0) await expect(page.locator(':focus')).toBeVisible();
  else await expect(page.locator('main')).toBeVisible();
}

test('player landing supports keyboard navigation and accessibility scanning', async ({ page }) => {
  await installPublicRoutes(page);
  await page.goto('/');
  await exerciseFirstKeyboardTarget(page);
  await expectNoSeriousViolations(page);
});

test('mobile player viewport remains accessible and visually stable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only visual baseline');
  await installPublicRoutes(page);
  await page.goto('/');
  await expect(page).toHaveScreenshot('player-mobile.png', { fullPage: true });
  await expectNoSeriousViolations(page);
});

test('anonymous admin boundary remains keyboard accessible and visually stable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop-only admin baseline');
  await page.goto(adminUrl);
  await exerciseFirstKeyboardTarget(page);
  await expectNoSeriousViolations(page);
  await expect(page).toHaveScreenshot('admin-desktop-anonymous.png', { fullPage: true });
});
