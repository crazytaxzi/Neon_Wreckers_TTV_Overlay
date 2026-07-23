import { expect, test } from '@playwright/test';

const adminUrl = process.env.NW_ADMIN_BASE_URL ?? 'http://127.0.0.1:4174/admin/';

test.describe('production authentication boundaries', () => {
  test('unauthenticated player sees the public landing surface', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('Twitch sign-in starts through the server OAuth route', async ({ page }) => {
    let requestedPath = '';
    await page.route('**/api/v1/auth/twitch', async route => {
      requestedPath = new URL(route.request().url()).pathname;
      await route.fulfill({ status: 302, headers: { location: '/oauth-contract-target' } });
    });
    await page.route('**/oauth-contract-target', route => route.fulfill({ status: 200, body: 'redirected' }));

    await page.goto('/api/v1/auth/twitch');

    expect(requestedPath).toBe('/api/v1/auth/twitch');
    await expect(page).toHaveURL(/\/oauth-contract-target$/);
  });

  test('admin does not expose authenticated controls to an anonymous browser', async ({ page }) => {
    await page.goto(adminUrl);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/unauthorized|sign in|admin access/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /seed|broadcast|resolve|delete/i })).toHaveCount(0);
  });
});
