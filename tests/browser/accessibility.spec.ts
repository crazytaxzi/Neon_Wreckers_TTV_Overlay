import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { installPublicRoutes } from './fixtures.js';

const adminUrl = process.env.NW_ADMIN_BASE_URL ?? 'http://127.0.0.1:4174/admin/';

async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''))).toEqual([]);
}

test('player landing supports keyboard navigation and accessibility scanning', async ({ page }) => {
  await installPublicRoutes(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('mobile player viewport remains accessible and visually stable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only visual baseline');
  await installPublicRoutes(page);
  await page.goto('/');
  await expect(page).toHaveScreenshot('player-mobile.png', { fullPage: true });
  await expectNoSeriousViolations(page);
});

test('anonymous admin boundary remains keyboard accessible and visually stable', async ({ page }) => {
  await page.goto(adminUrl);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await expectNoSeriousViolations(page);
  await expect(page).toHaveScreenshot('admin-desktop-anonymous.png', { fullPage: true });
});
