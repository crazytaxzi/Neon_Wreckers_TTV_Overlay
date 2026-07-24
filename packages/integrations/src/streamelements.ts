import { request } from 'undici';

export type StreamElementsAuthType = 'jwt' | 'oauth2';

export type StreamElementsIdentity = {
  channelId: string;
  provider: string;
  providerId: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type StreamElementsCredential = {
  apiBase: string;
  token: string;
  authType: StreamElementsAuthType;
  channelId: string;
  username: string;
  displayName: string;
  provider: string;
  providerId: string | null;
  avatarUrl: string | null;
  scopes: string[];
  pointsEnabled: boolean;
};

export type LoyaltyHealth = {
  ok: boolean;
  detail: string;
  identity?: StreamElementsIdentity;
  authType?: StreamElementsAuthType;
  scopes?: string[];
};

export interface LoyaltyProvider {
  name: 'streamelements' | 'disabled';
  connection(): Promise<StreamElementsCredential | null>;
  getBalance(args: { channelId: string; username: string }): Promise<{ balance: number; currencyName: string; raw?: unknown }>;
  debit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string }): Promise<{ externalReference: string; raw?: unknown }>;
  credit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string; priorReference?: string }): Promise<{ externalReference: string; raw?: unknown }>;
  health(): Promise<LoyaltyHealth>;
}

export class DisabledLoyaltyProvider implements LoyaltyProvider {
  name = 'disabled' as const;
  async connection() { return null; }
  async getBalance(): Promise<never> { throw new Error('StreamElements integration is disabled.'); }
  async debit(): Promise<never> { throw new Error('StreamElements integration is disabled.'); }
  async credit(): Promise<never> { throw new Error('StreamElements integration is disabled.'); }
  async health() { return { ok: false, detail: 'disabled' }; }
}

export interface StreamElementsConfig {
  provider: 'disabled' | 'streamelements';
  apiBase: string;
  jwt: string;
  channelId?: string;
}

export type StreamElementsOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
};

export type StreamElementsTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string | string[];
};

function authHeader(authType: StreamElementsAuthType, token: string) {
  return `${authType === 'oauth2' ? 'OAuth' : 'Bearer'} ${token}`;
}

function channelIdentity(raw: Record<string, unknown>): StreamElementsIdentity {
  const channelId = String(raw._id ?? raw.id ?? '');
  if (!channelId) throw new Error('StreamElements did not return a channel ID.');
  return {
    channelId,
    provider: String(raw.provider ?? 'unknown'),
    providerId: raw.providerId == null ? null : String(raw.providerId),
    username: String(raw.username ?? raw.alias ?? raw.displayName ?? channelId),
    displayName: String(raw.displayName ?? raw.username ?? raw.alias ?? channelId),
    avatarUrl: raw.avatar == null ? null : String(raw.avatar)
  };
}

export function normalizeStreamElementsScopes(scope: string | string[] | undefined): string[] {
  if (Array.isArray(scope)) return [...new Set(scope.map(value => value.trim()).filter(Boolean))];
  return [...new Set(String(scope ?? '').split(/[ ,]+/).map(value => value.trim()).filter(Boolean))];
}

export class StreamElementsProvider implements LoyaltyProvider {
  name = 'streamelements' as const;

  constructor(private readonly config: StreamElementsCredential) {}

  async connection() {
    return this.config;
  }

  private async call<T>(method: string, pathname: string, body?: unknown): Promise<T> {
    const response = await request(`${this.config.apiBase}${pathname}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: authHeader(this.config.authType, this.config.token),
        'content-type': 'application/json'
      },
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

  async fetchIdentity() {
    const raw = await this.call<Record<string, unknown>>('GET', '/channels/me');
    return channelIdentity(raw);
  }

  async getBalance({ channelId, username }: { channelId: string; username: string }) {
    const selectedChannelId = this.config.channelId || channelId;
    const raw = await this.call<Record<string, unknown>>('GET', `/points/${encodeURIComponent(selectedChannelId)}/${encodeURIComponent(username)}`);
    const balance = Number(raw?.points ?? raw?.balance ?? raw?.pointsAmount ?? 0);
    return { balance, currencyName: 'points', raw };
  }

  async debit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string }) {
    const raw = await this.call<Record<string, unknown>>(
      'PUT',
      `/points/${encodeURIComponent(this.config.channelId || args.channelId)}/${encodeURIComponent(args.username)}/${-Math.abs(args.amount)}`,
      { reason: args.reason, idempotencyKey: args.idempotencyKey }
    );
    return { externalReference: String(raw?._id ?? raw?.id ?? args.idempotencyKey), raw };
  }

  async credit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string; priorReference?: string }) {
    const raw = await this.call<Record<string, unknown>>(
      'PUT',
      `/points/${encodeURIComponent(this.config.channelId || args.channelId)}/${encodeURIComponent(args.username)}/${Math.abs(args.amount)}`,
      { reason: args.reason, idempotencyKey: args.idempotencyKey, priorReference: args.priorReference }
    );
    return { externalReference: String(raw?._id ?? raw?.id ?? args.idempotencyKey), raw };
  }

  async health(): Promise<LoyaltyHealth> {
    try {
      return {
        ok: true,
        detail: 'StreamElements API reachable',
        identity: await this.fetchIdentity(),
        authType: this.config.authType,
        scopes: this.config.scopes
      };
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : String(error), authType: this.config.authType, scopes: this.config.scopes };
    }
  }
}

export class ResolvingLoyaltyProvider implements LoyaltyProvider {
  name = 'streamelements' as const;

  constructor(private readonly resolve: () => Promise<StreamElementsCredential | null>) {}

  async connection() {
    return this.resolve();
  }

  private async provider() {
    const credential = await this.resolve();
    if (!credential) throw new Error('No active StreamElements account is selected.');
    return new StreamElementsProvider(credential);
  }

  async getBalance(args: { channelId: string; username: string }) {
    return (await this.provider()).getBalance(args);
  }

  async debit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string }) {
    return (await this.provider()).debit(args);
  }

  async credit(args: { channelId: string; username: string; amount: number; reason: string; idempotencyKey: string; priorReference?: string }) {
    return (await this.provider()).credit(args);
  }

  async health() {
    const credential = await this.resolve();
    if (!credential) return { ok: false, detail: 'No active StreamElements account is selected.' };
    return new StreamElementsProvider(credential).health();
  }
}

export function buildStreamElementsAuthorizeUrl(config: Pick<StreamElementsOAuthConfig, 'clientId' | 'redirectUri' | 'scopes'>, state: string) {
  const url = new URL('https://api.streamelements.com/oauth2/authorize');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

async function exchangeToken(body: URLSearchParams): Promise<StreamElementsTokenResponse> {
  const response = await request('https://api.streamelements.com/oauth2/token', {
    method: 'POST',
    body: body.toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    headersTimeout: 10_000,
    bodyTimeout: 10_000
  });
  const text = await response.body.text();
  if (response.statusCode >= 400) throw new Error(`StreamElements token exchange failed with ${response.statusCode}: ${text.slice(0, 200)}`);
  return JSON.parse(text) as StreamElementsTokenResponse;
}

export function exchangeStreamElementsCode(config: StreamElementsOAuthConfig, code: string) {
  return exchangeToken(new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri
  }));
}

export function refreshStreamElementsToken(config: Pick<StreamElementsOAuthConfig, 'clientId' | 'clientSecret'>, refreshToken: string) {
  return exchangeToken(new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  }));
}

export async function validateStreamElementsOAuthToken(accessToken: string) {
  const response = await request('https://api.streamelements.com/oauth2/validate', {
    headers: { Authorization: `OAuth ${accessToken}` },
    headersTimeout: 10_000,
    bodyTimeout: 10_000
  });
  const text = await response.body.text();
  if (response.statusCode >= 400) throw new Error(`StreamElements token validation failed with ${response.statusCode}: ${text.slice(0, 200)}`);
  const raw = JSON.parse(text) as { channel_id?: string; client_id?: string; expires_in?: number; scopes?: string[] };
  return {
    channelId: String(raw.channel_id ?? ''),
    clientId: String(raw.client_id ?? ''),
    expiresIn: Number(raw.expires_in ?? 0),
    scopes: normalizeStreamElementsScopes(raw.scopes)
  };
}

export function createResolvingLoyaltyProvider(resolve: () => Promise<StreamElementsCredential | null>): LoyaltyProvider {
  return new ResolvingLoyaltyProvider(resolve);
}

export function createLoyaltyProvider(config: StreamElementsConfig): LoyaltyProvider {
  if (config.provider === 'disabled') return new DisabledLoyaltyProvider();
  return new StreamElementsProvider({
    apiBase: config.apiBase,
    token: config.jwt,
    authType: 'jwt',
    channelId: config.channelId ?? '',
    username: '',
    displayName: '',
    provider: 'unknown',
    providerId: null,
    avatarUrl: null,
    scopes: [],
    pointsEnabled: true
  });
}
