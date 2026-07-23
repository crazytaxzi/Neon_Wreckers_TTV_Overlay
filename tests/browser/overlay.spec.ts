import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { disconnectSocket, emitRealtime, installControllableSocket, installPublicRoutes, station, wreck } from './fixtures.js';

const overlayUrl = process.env.NW_OVERLAY_BASE_URL ?? 'http://127.0.0.1:4175/overlay/?preview=1';

async function openOverlay(page: Page) {
  await installControllableSocket(page);
  await installPublicRoutes(page);
  await page.goto(overlayUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('main[data-connection-state="live"]')).toBeVisible();
}

test.describe('public OBS overlay', () => {
  test('renders the initial public station, wreck, and history snapshot', async ({ page }) => {
    await openOverlay(page);
    await expect(page.getByText(station.name)).toBeVisible();
    await expect(page.getByText(wreck.name)).toBeVisible();
    await expect(page.getByText('Station systems nominal')).toBeVisible();
  });

  test('applies a validated WebSocket station update', async ({ page }) => {
    await openOverlay(page);
    await emitRealtime(page, { type: 'station.updated', station: { ...station, name: 'REACTOR CROWN', power: 41 } });
    await expect(page.getByText('REACTOR CROWN')).toBeVisible();
  });

  test('shows reconnecting after a socket disconnect and recovers', async ({ page }) => {
    await openOverlay(page);
    await disconnectSocket(page);
    await expect(page.locator('main')).toHaveAttribute('data-connection-state', 'reconnecting');
    await expect(page.locator('main')).toHaveAttribute('data-connection-state', 'live', { timeout: 5_000 });
  });

  test('honors reduced motion and has no serious accessibility violations', async ({ page }) => {
    await openOverlay(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''))).toEqual([]);
  });

  for (const viewport of [
    { name: 'overlay-1280x720', width: 1280, height: 720 },
    { name: 'overlay-1920x1080', width: 1920, height: 1080 },
    { name: 'overlay-2560x1440', width: 2560, height: 1440 }
  ]) {
    test(`captures ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openOverlay(page);
      await expect(page).toHaveScreenshot(`${viewport.name}.png`, { fullPage: true });
    });
  }
});
