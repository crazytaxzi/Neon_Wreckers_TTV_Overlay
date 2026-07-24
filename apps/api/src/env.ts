import { z } from 'zod';

const optionalUrl = z.preprocess(
  value => value === '' || value == null ? undefined : value,
  z.string().url().optional()
);

export const twitchEventSubScopes = [
  'user:read:chat',
  'user:bot',
  'channel:bot',
  'moderator:read:followers',
  'channel:read:subscriptions',
  'bits:read'
] as const;

const twitchBaseScopes = ['user:read:email', ...twitchEventSubScopes] as const;

export const streamElementsBaseScopes = [
  'channel:read',
  'loyalty:read',
  'loyalty:write',
  'activities:read'
] as const;

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  SESSION_COOKIE_NAME: z.string().min(1).default('nw_session'),
  SESSION_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  TWITCH_CLIENT_ID: z.string().default(''),
  TWITCH_CLIENT_SECRET: z.string().default(''),
  TWITCH_REDIRECT_URI: optionalUrl,
  TWITCH_REQUIRED_SCOPES: z.string().default(twitchBaseScopes.join(' ')),
  TWITCH_EVENTSUB_SECRET: z.string().min(10).default('development-eventsub-secret'),
  CREDENTIAL_ENCRYPTION_KEY: z.string().min(32).default('development-credential-key-32-bytes'),
  STREAMER_TWITCH_ID: z.string().default(''),
  STREAMELEMENTS_PROVIDER: z.enum(['disabled', 'streamelements']).default('disabled'),
  STREAMELEMENTS_CHANNEL_ID: z.string().default(''),
  STREAMELEMENTS_JWT: z.string().default(''),
  STREAMELEMENTS_CLIENT_ID: z.string().default(''),
  STREAMELEMENTS_CLIENT_SECRET: z.string().default(''),
  STREAMELEMENTS_REDIRECT_URI: optionalUrl,
  STREAMELEMENTS_OAUTH_SCOPES: z.string().default(streamElementsBaseScopes.join(' ')),
  STREAMELEMENTS_API_BASE: z.string().url().default('https://api.streamelements.com/kappa/v2'),
  FEATURE_POINTS_ACTIONS: z.enum(['true', 'false']).default('false'),
  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1200),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60)
}).superRefine((values, context) => {
  if (values.NODE_ENV === 'production') {
    const requiredTwitchValues = [
      ['TWITCH_CLIENT_ID', values.TWITCH_CLIENT_ID],
      ['TWITCH_CLIENT_SECRET', values.TWITCH_CLIENT_SECRET],
      ['TWITCH_REDIRECT_URI', values.TWITCH_REDIRECT_URI],
      ['STREAMER_TWITCH_ID', values.STREAMER_TWITCH_ID]
    ] as const;
    for (const [name, value] of requiredTwitchValues) {
      if (!value) context.addIssue({ code: z.ZodIssueCode.custom, message: `${name} is required in production.` });
    }
    if (values.TRUST_PROXY !== 'true') {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'TRUST_PROXY must be true in production.' });
    }
    if (values.COOKIE_SECURE !== 'true') {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'COOKIE_SECURE must be true in production.' });
    }
    if (values.TWITCH_EVENTSUB_SECRET === 'development-eventsub-secret') {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'TWITCH_EVENTSUB_SECRET must be replaced in production.' });
    }
    if (values.CREDENTIAL_ENCRYPTION_KEY === 'development-credential-key-32-bytes') {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'CREDENTIAL_ENCRYPTION_KEY must be replaced in production.' });
    }
  }

  const legacyValues = [values.STREAMELEMENTS_CHANNEL_ID, values.STREAMELEMENTS_JWT].filter(Boolean);
  if (legacyValues.length === 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'STREAMELEMENTS_CHANNEL_ID and STREAMELEMENTS_JWT must be configured together.' });
  }

  const oauthValues = [values.STREAMELEMENTS_CLIENT_ID, values.STREAMELEMENTS_CLIENT_SECRET, values.STREAMELEMENTS_REDIRECT_URI].filter(Boolean);
  if (oauthValues.length > 0 && oauthValues.length < 3) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'STREAMELEMENTS_CLIENT_ID, STREAMELEMENTS_CLIENT_SECRET, and STREAMELEMENTS_REDIRECT_URI must be configured together.' });
  }

  if (values.FEATURE_POINTS_ACTIONS === 'true' && values.STREAMELEMENTS_PROVIDER !== 'streamelements') {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'FEATURE_POINTS_ACTIONS requires STREAMELEMENTS_PROVIDER=streamelements.' });
  }
});

export function parseEnvironment(source: NodeJS.ProcessEnv) {
  return environmentSchema.parse(source);
}

export const env = parseEnvironment(process.env);
export const isProd = env.NODE_ENV === 'production';
export const trustProxy = env.TRUST_PROXY === 'true';
export const cookieSecure = env.COOKIE_SECURE === 'true';
export const corsOrigins = env.CORS_ORIGINS.split(',').map(value => value.trim()).filter(Boolean);
const configuredTwitchScopes = env.TWITCH_REQUIRED_SCOPES.split(/[ ,]+/).filter(Boolean);
export const twitchScopes = [...new Set([...twitchBaseScopes, ...configuredTwitchScopes])];
const configuredStreamElementsScopes = env.STREAMELEMENTS_OAUTH_SCOPES.split(/[ ,]+/).filter(Boolean);
export const streamElementsScopes = [...new Set([...streamElementsBaseScopes, ...configuredStreamElementsScopes])];
