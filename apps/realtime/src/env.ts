import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SOCKET_PATH: z.string().default('/realtime'),
  REDIS_URL: z.string().optional(),

  /**
   * HS256 signing secret for access tokens. Required in production — a
   * predictable secret means anyone can mint a doctor's token.
   */
  JWT_SECRET: z.string().min(32).optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:support@afrat.app'),
  STORAGE_PUBLIC_BASE_URL: z.string().default('http://localhost:4000/uploads'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const isProduction = parsed.data.NODE_ENV === 'production';

if (isProduction && !parsed.data.JWT_SECRET) {
  console.error(
    'JWT_SECRET is required in production. Generate one with:\n' +
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
  );
  process.exit(1);
}

/**
 * Development falls back to a fixed secret so tokens survive a restart and
 * nobody has to configure anything to run the app. The production guard above
 * makes sure this can never ship.
 */
const DEV_JWT_SECRET = 'afrat-development-only-secret-do-not-use-in-production';

export const env = {
  ...parsed.data,
  JWT_SECRET: parsed.data.JWT_SECRET ?? DEV_JWT_SECRET,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  isProduction,
};
