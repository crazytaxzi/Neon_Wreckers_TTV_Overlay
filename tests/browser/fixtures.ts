import type { Page } from '@playwright/test';

export const station = {
  name: 'NEON PRIME HUB', level: 4, population: 1248, power: 78, morale: 86, integrity: 92,
  threatLevel: 'ELEVATED', storageCapacity: 24000, storageUsed: 15240,
  resources: { scrap: 112600, credits: 8450 },
  alerts: []
};

export const wreck = {
  id: 'dread-frigate-009', name: 'DREAD FRIGATE', risk: 'EXTREME', integrity: 23,
  description: 'Unknown capital-class hull. Defensive systems and reactor instability detected.'
};

export const history = [{
  id: 'h1', category: 'station', title: 'Station systems nominal',
  body: 'Salvage operations remain active.', createdAt: '2026-07-21T22:20:00Z',
  presentation: {
    severity: 'positive', category: 'station', priority: 20, breaking: false,
    iconKey: 'station', localizationKey: 'history.station.nominal', fallbackText: 'Station systems nominal'
  }
}];

export async function installPublicRoutes(page: Page) {
  await page.route('**/api/v1/station', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ data: station })
  }));
  await page.route('**/api/v1/history', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ data: history })
  }));
  await page.route('**/api/v1/wrecks/current', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ data: wreck })
  }));
  await page.route('**/overlay/overlay-config.json', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: { top: 34, left: 34, width: 520, scale: 1, visible: true },
      ticker: { top: 34, width: 1400, scale: 1, rotationSeconds: 20, visible: true },
      feedIndicator: true, scanlines: true, glass: true, breakingNews: true, previewBackground: true,
      visibility: { tickerHoldSeconds: 120, statusHoldSeconds: 120, fadeSeconds: 0.3, keepVisibleInPreview: true }
    })
  }));
}

export async function installControllableSocket(page: Page) {
  await page.addInitScript(() => {
    class TestSocket {
      static instances: TestSocket[] = [];
      readyState = 0;
      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor() {
        TestSocket.instances.push(this);
        queueMicrotask(() => {
          this.readyState = 1;
          this.onopen?.(new Event('open'));
        });
      }
      send() {}
      close() {
        this.readyState = 3;
        this.onclose?.(new CloseEvent('close'));
      }
      emit(data: unknown) {
        this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
      }
    }
    Object.defineProperty(window, 'WebSocket', { value: TestSocket, configurable: true });
    Object.defineProperty(window, '__nwTestSockets', { value: TestSocket.instances, configurable: true });
  });
}

export async function emitRealtime(page: Page, event: unknown) {
  await page.evaluate(payload => {
    const sockets = (window as unknown as { __nwTestSockets: Array<{ emit(value: unknown): void }> }).__nwTestSockets;
    sockets.at(-1)?.emit(payload);
  }, event);
}

export async function disconnectSocket(page: Page) {
  await page.evaluate(() => {
    const sockets = (window as unknown as { __nwTestSockets: Array<{ close(): void }> }).__nwTestSockets;
    sockets.at(-1)?.close();
  });
}
