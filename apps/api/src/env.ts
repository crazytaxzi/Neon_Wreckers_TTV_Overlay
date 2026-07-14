import { z } from 'zod';

const optionalUrl = z.preprocess(
  value => value === '' || value == null ? undefined : value,
  z.string().url().optional()
);

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
  TWITCH_REQUIRED_SCOPES: z.string().default('user:read:email'),
  STREAMER_TWITCH_ID: z.string().default(''),
  STREAMELEMENTS_PROVIDER: z.enum(['disabled', 'streamelements']).default('disabled'),
  STREAMELEMENTS_CHANNEL_ID: z.string().default(''),
  STREAMELEMENTS_JWT: z.string().default(''),
  STREAMELEMENTS_API_BASE: z.string().url().default('https://api.streamelements.com/kappa/v2'),
  FEATURE_POINTS_ACTIONS: z.enum(['true', 'false']).default('false'),
  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
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
  }

  if (values.STREAMELEMENTS_PROVIDER === 'streamelements') {
    if (!values.STREAMELEMENTS_CHANNEL_ID) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'STREAMELEMENTS_CHANNEL_ID is required for the StreamElements provider.' });
    }
    if (!values.STREAMELEMENTS_JWT) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'STREAMELEMENTS_JWT is required for the StreamElements provider.' });
    }
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
export const twitchScopes = env.TWITCH_REQUIRED_SCOPES.split(/[ ,]+/).filter(Boolean);
