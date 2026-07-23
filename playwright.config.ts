import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.NW_BROWSER_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'test-results/playwright',
  snapshotDir: './tests/browser/__snapshots__',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css'
    }
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }
    },
    {
      name: 'mobile-chromium',
      testIgnore: /overlay\.spec\.ts/,
      use: { ...devices['Pixel 7'], reducedMotion: 'reduce' }
    }
  ]
});
