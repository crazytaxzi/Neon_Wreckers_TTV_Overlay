import { expect, test } from '@playwright/test';

test.describe('production authentication boundaries', () => {
  test('unauthenticated player sees the public landing surface', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('Twitch sign-in starts through the server OAuth route', async ({ page }) => {
    await page.goto('/');

    const signIn = page.getByRole('link', { name: /twitch|sign in|connect/i }).first();
    await expect(signIn).toBeVisible();

    const href = await signIn.getAttribute('href');
    expect(href).toBeTruthy();
    expect(new URL(href!, page.url()).pathname).toMatch(/^\/api\/v1\/auth\/twitch(?:\/start)?$/);
  });

  test('admin does not expose authenticated controls to an anonymous browser', async ({ page }) => {
    await page.goto('/admin/');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/unauthorized|sign in|admin access/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /seed|broadcast|resolve|delete/i })).toHaveCount(0);
  });
});
