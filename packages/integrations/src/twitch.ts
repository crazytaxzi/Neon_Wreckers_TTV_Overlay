import { request } from 'undici';

export interface TwitchTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string[];
  token_type: string;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  email?: string;
}

export interface TwitchConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export function buildTwitchAuthorizeUrl(config: TwitchConfig, state: string) {
  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeTwitchCode(config: TwitchConfig, code: string): Promise<TwitchTokenResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri
  });
  const response = await request('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: body.toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    headersTimeout: 10_000,
    bodyTimeout: 10_000
  });
  if (response.statusCode >= 400) throw new Error(`Twitch token exchange failed with ${response.statusCode}`);
  return response.body.json() as Promise<TwitchTokenResponse>;
}

export async function fetchTwitchUser(clientId: string, accessToken: string): Promise<TwitchUser> {
  const response = await request('https://api.twitch.tv/helix/users', {
    headers: { 'Client-Id': clientId, Authorization: `Bearer ${accessToken}` },
    headersTimeout: 10_000,
    bodyTimeout: 10_000
  });
  if (response.statusCode >= 400) throw new Error(`Twitch user lookup failed with ${response.statusCode}`);
  const json = await response.body.json() as { data: TwitchUser[] };
  if (!json.data?.[0]) throw new Error('Twitch user lookup returned no user');
  return json.data[0];
}

export async function refreshTwitchToken(config: Pick<TwitchConfig, 'clientId' | 'clientSecret'>, refreshToken: string): Promise<TwitchTokenResponse> {
  const body = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'refresh_token', refresh_token: refreshToken });
  const response = await request('https://id.twitch.tv/oauth2/token', { method: 'POST', body: body.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' }, headersTimeout: 10_000, bodyTimeout: 10_000 });
  if (response.statusCode >= 400) throw new Error(`Twitch token refresh failed with ${response.statusCode}`);
  return response.body.json() as Promise<TwitchTokenResponse>;
}

export async function fetchTwitchAppToken(clientId: string, clientSecret: string) {
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' });
  const response = await request('https://id.twitch.tv/oauth2/token', { method: 'POST', body: body.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' }, headersTimeout: 10_000, bodyTimeout: 10_000 });
  if (response.statusCode >= 400) throw new Error(`Twitch app token request failed with ${response.statusCode}`);
  return response.body.json() as Promise<{ access_token: string; expires_in: number; token_type: string }>;
}

export async function createTwitchEventSubSubscription(args: { clientId: string; accessToken: string; type: string; version: string; condition: Record<string, string>; callback: string; secret: string }) {
  const response = await request('https://api.twitch.tv/helix/eventsub/subscriptions', { method: 'POST', headers: { 'Client-Id': args.clientId, Authorization: `Bearer ${args.accessToken}`, 'content-type': 'application/json' }, body: JSON.stringify({ type: args.type, version: args.version, condition: args.condition, transport: { method: 'webhook', callback: args.callback, secret: args.secret } }), headersTimeout: 10_000, bodyTimeout: 10_000 });
  const payload = await response.body.json() as unknown;
  if (response.statusCode >= 400) throw new Error(`Twitch EventSub subscription failed with ${response.statusCode}: ${JSON.stringify(payload)}`);
  return payload;
}
