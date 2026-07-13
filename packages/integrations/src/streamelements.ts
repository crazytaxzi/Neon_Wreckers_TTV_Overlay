import { request } from 'undici';

export interface LoyaltyProvider {
  name: 'streamelements' | 'disabled';
  getBalance(args: { channelId: string; username: string }): Promise<{ balance: number; currencyName: string; raw?: unknown }>;
  debit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string }): Promise<{ externalReference: string; raw?: unknown }>;
  credit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string; priorReference?: string }): Promise<{ externalReference: string; raw?: unknown }>;
  health(): Promise<{ ok: boolean; detail: string }>;
}

export class DisabledLoyaltyProvider implements LoyaltyProvider {
  name = 'disabled' as const;
  async getBalance(): Promise<never> { throw new Error('StreamElements integration is disabled.'); }
  async debit(): Promise<never> { throw new Error('StreamElements integration is disabled.'); }
  async credit(): Promise<never> { throw new Error('StreamElements integration is disabled.'); }
  async health() { return { ok: false, detail: 'disabled' }; }
}

export interface StreamElementsConfig {
  provider: 'disabled' | 'streamelements';
  apiBase: string;
  jwt: string;
}

export class StreamElementsProvider implements LoyaltyProvider {
  name = 'streamelements' as const;

  constructor(private readonly config: Omit<StreamElementsConfig, 'provider'>) {}

  private async call<T>(method: string, pathname: string, body?: unknown): Promise<T> {
    const response = await request(`${this.config.apiBase}${pathname}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { Authorization: `Bearer ${this.config.jwt}`, 'content-type': 'application/json' },
      headersTimeout: 10_000,
      bodyTimeout: 10_000
    });
    const text = await response.body.text();
    if (response.statusCode === 429) throw new Error('StreamElements rate limit reached; retry later.');
    if (response.statusCode >= 400) {
      throw new Error(`StreamElements API ${method} ${pathname} failed with ${response.statusCode}: ${text.slice(0, 200)}`);
    }
    return text ? JSON.parse(text) as T : undefined as T;
  }

  async getBalance({ channelId, username }: { channelId: string; username: string }) {
    const raw = await this.call<Record<string, unknown>>('GET', `/points/${encodeURIComponent(channelId)}/${encodeURIComponent(username)}`);
    const balance = Number(raw?.points ?? raw?.balance ?? raw?.pointsAmount ?? 0);
    return { balance, currencyName: 'points', raw };
  }

  async debit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string }) {
    const raw = await this.call<Record<string, unknown>>(
      'PUT',
      `/points/${encodeURIComponent(args.channelId)}/${encodeURIComponent(args.username)}/${-Math.abs(args.amount)}`,
      { reason: args.reason, idempotencyKey: args.idempotencyKey }
    );
    return { externalReference: String(raw?._id ?? raw?.id ?? args.idempotencyKey), raw };
  }

  async credit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string; priorReference?: string }) {
    const raw = await this.call<Record<string, unknown>>(
      'PUT',
      `/points/${encodeURIComponent(args.channelId)}/${encodeURIComponent(args.username)}/${Math.abs(args.amount)}`,
      { reason: args.reason, idempotencyKey: args.idempotencyKey, priorReference: args.priorReference }
    );
    return { externalReference: String(raw?._id ?? raw?.id ?? args.idempotencyKey), raw };
  }

  async health() {
    try {
      await this.call('GET', '/channels/me');
      return { ok: true, detail: 'StreamElements API reachable' };
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : String(error) };
    }
  }
}

export function createLoyaltyProvider(config: StreamElementsConfig): LoyaltyProvider {
  if (config.provider === 'disabled') return new DisabledLoyaltyProvider();
  return new StreamElementsProvider({ apiBase: config.apiBase, jwt: config.jwt });
}
