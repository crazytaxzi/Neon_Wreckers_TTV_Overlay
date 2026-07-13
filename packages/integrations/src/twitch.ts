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
