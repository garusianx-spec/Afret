import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { toFaDigits } from '../auth/digits.js';
import { isValidMobile, normalizeMobile } from '../auth/mobile.js';
import {
  checkPasswordStrength,
  hashPassword,
  verifyPassword,
} from '../auth/password.js';
import {
  ACCESS_TTL_SECONDS,
  REFRESH_COOKIE,
  REFRESH_TTL_SECONDS,
  generateRefreshToken,
  hashRefreshToken,
  refreshCookieOptions,
  signAccessToken,
} from '../auth/tokens.js';
import { permissionsFor, toPublicUser, type UserRecord } from '../auth/types.js';
import {
  LOCKOUT,
  isLockedOut,
  nextLockout,
  userStore,
} from '../auth/userStore.js';
import { requireAuth } from '../auth/middleware.js';
import { ensureDefaultMemberships } from '../store/membershipStore.js';

/* ------------------------------------------------------------------ *
 * Schemas
 * ------------------------------------------------------------------ */

/**
 * Mobile numbers are normalised, not just matched: `.transform()` runs after
 * `.refine()`, so every handler downstream sees the canonical `+989…` form
 * and can never accidentally compare two spellings of the same number.
 */
const mobileField = z
  .string()
  .min(10, 'شماره موبایل معتبر نیست.')
  .max(20, 'شماره موبایل معتبر نیست.')
  .refine(isValidMobile, 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.')
  .transform((value) => normalizeMobile(value)!);

const passwordField = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ نویسه باشد.')
  .max(128, 'رمز عبور نمی‌تواند بیش از ۱۲۸ نویسه باشد.');

const registerSchema = z.object({
  mobile: mobileField,
  password: passwordField,
  fullName: z.string().trim().min(2).max(80).optional(),
});

const loginSchema = z.object({
  mobile: mobileField,
  password: z.string().min(1, 'رمز عبور را وارد کنید.').max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordField,
});

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** First Zod message, already Persian and safe to show the user. */
function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'اطلاعات واردشده معتبر نیست.';
}

async function issueSession(
  request: FastifyRequest,
  reply: FastifyReply,
  user: UserRecord,
) {
  const refreshToken = generateRefreshToken();

  await userStore.createSession({
    tokenHash: hashRefreshToken(refreshToken),
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000).toISOString(),
    userAgent: request.headers['user-agent'],
    ip: request.ip,
  });

  reply.setCookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  const accessToken = await signAccessToken({
    userId: user.id,
    mobile: user.mobile,
    role: user.role,
    permissions: permissionsFor(user.role),
    name: user.fullName,
  });

  return {
    body: {
      accessToken,
      expiresIn: ACCESS_TTL_SECONDS,
      user: toPublicUser(user),
    },
    // The caller needs this to link the rotated-from record. Reading it back
    // off `request.cookies` would return the *inbound* token, not this one.
    refreshTokenHash: hashRefreshToken(refreshToken),
  };
}

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

export async function authRoutes(app: FastifyInstance) {
  /**
   * Rate limiting is per-route rather than global: the chat endpoints are
   * chatty by nature, while a credential endpoint being hit 20 times a minute
   * from one IP is an attack.
   */
  const credentialRateLimit = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
          message: 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید.',
        }),
      },
    },
  };

  app.post(
    '/api/auth/register',
    credentialRateLimit,
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: firstError(parsed.error) });
      }

      const { mobile, password, fullName } = parsed.data;

      const strength = checkPasswordStrength(password);
      if (!strength.ok) {
        return reply.code(400).send({ message: strength.message });
      }

      const existing = await userStore.findByMobile(mobile);
      if (existing) {
        // Registration inevitably discloses that a number is taken — there is
        // no way to create an account without it. Login, where it matters
        // more, stays uniform (see below).
        return reply
          .code(409)
          .send({ message: 'این شماره قبلاً ثبت شده است. وارد شوید.' });
      }

      const user = await userStore.create({
        mobile,
        passwordHash: await hashPassword(password),
        fullName,
      });

      // The default rooms (cohorts, topic forums, and the legacy demo
      // consult room) are mother-facing content. A clinician joining them
      // means her own name shows up as a room title in her own inbox — she
      // gets patients through provisioned 1:1 consult rooms instead.
      if (user.role === 'mother') {
        await ensureDefaultMemberships(user.id);
      }

      request.log.info({ userId: user.id }, 'user registered');
      const issued = await issueSession(request, reply, user);
      return reply.code(201).send(issued.body);
    },
  );

  app.post('/api/auth/login', credentialRateLimit, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: firstError(parsed.error) });
    }

    const { mobile, password } = parsed.data;
    const user = await userStore.findByMobile(mobile);

    // Uniform failure. Returning "no such account" here would turn the login
    // form into a directory of who uses a pregnancy app — which, for this
    // user base, is a safety problem and not just a privacy one.
    const invalid = () =>
      reply.code(401).send({ message: 'شماره موبایل یا رمز عبور نادرست است.' });

    if (!user) {
      // Burn comparable time so absent and present accounts are
      // indistinguishable by response latency.
      await verifyPassword(
        '$argon2id$v=19$m=19456,t=2,p=1$YWZyYXRkdW1teXNhbHQ$0000000000000000000000000000000000000000000',
        password,
      );
      return invalid();
    }

    if (isLockedOut(user)) {
      return reply.code(429).send({
        message: `به دلیل تلاش‌های ناموفق، حساب شما تا ${toFaDigits(LOCKOUT.windowMinutes)} دقیقه قفل است.`,
      });
    }

    if (!(await verifyPassword(user.passwordHash, password))) {
      const failedAttempts = user.failedAttempts + 1;
      await userStore.update(user.id, {
        failedAttempts,
        lockedUntil: nextLockout(failedAttempts),
      });
      return invalid();
    }

    // Successful login clears the counter.
    const fresh =
      (await userStore.update(user.id, {
        failedAttempts: 0,
        lockedUntil: undefined,
      })) ?? user;

    request.log.info({ userId: fresh.id }, 'user logged in');
    const issued = await issueSession(request, reply, fresh);
    return reply.send(issued.body);
  });

  /**
   * Refresh with rotation.
   *
   * Every refresh invalidates the presented token and issues a new one. If a
   * token that was already rotated comes back, it was stolen (or replayed),
   * so every session for that account is revoked and the user must log in.
   */
  app.post('/api/auth/refresh', async (request, reply) => {
    const presented = request.cookies?.[REFRESH_COOKIE];
    if (!presented) {
      return reply.code(401).send({ message: 'نشست معتبر نیست. دوباره وارد شوید.' });
    }

    const tokenHash = hashRefreshToken(presented);
    const session = await userStore.findSession(tokenHash);

    if (!session) {
      reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
      return reply.code(401).send({ message: 'نشست معتبر نیست. دوباره وارد شوید.' });
    }

    if (session.revokedAt) {
      const revoked = await userStore.revokeAllSessions(session.userId);
      request.log.warn(
        { userId: session.userId, revoked },
        'refresh token reuse detected — all sessions revoked',
      );
      reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
      return reply
        .code(401)
        .send({ message: 'نشست شما باطل شد. لطفاً دوباره وارد شوید.' });
    }

    if (Date.parse(session.expiresAt) < Date.now()) {
      await userStore.revokeSession(tokenHash);
      reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
      return reply.code(401).send({ message: 'نشست منقضی شده است. دوباره وارد شوید.' });
    }

    const user = await userStore.findById(session.userId);
    if (!user) {
      reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
      return reply.code(401).send({ message: 'حساب کاربری یافت نشد.' });
    }

    const issued = await issueSession(request, reply, user);
    // Rotate: mark the presented token spent and point it at its successor,
    // which is what makes a replay of the old token detectable above.
    await userStore.revokeSession(tokenHash, issued.refreshTokenHash);

    return reply.send(issued.body);
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const presented = request.cookies?.[REFRESH_COOKIE];
    if (presented) await userStore.revokeSession(hashRefreshToken(presented));

    reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return reply.code(204).send();
  });

  /** Current user, derived from the access token. */
  app.get(
    '/api/auth/me',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = await userStore.findById(request.authUser!.id);
      if (!user) return reply.code(404).send({ message: 'حساب کاربری یافت نشد.' });
      return { user: toPublicUser(user) };
    },
  );

  app.post(
    '/api/auth/change-password',
    { preHandler: requireAuth, ...credentialRateLimit },
    async (request, reply) => {
      const parsed = changePasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: firstError(parsed.error) });
      }

      const user = await userStore.findById(request.authUser!.id);
      if (!user) return reply.code(404).send({ message: 'حساب کاربری یافت نشد.' });

      if (!(await verifyPassword(user.passwordHash, parsed.data.currentPassword))) {
        return reply.code(401).send({ message: 'رمز عبور فعلی نادرست است.' });
      }

      const strength = checkPasswordStrength(parsed.data.newPassword);
      if (!strength.ok) return reply.code(400).send({ message: strength.message });

      await userStore.update(user.id, {
        passwordHash: await hashPassword(parsed.data.newPassword),
      });

      // A password change ends every other session — that is the whole point
      // of changing it after a suspected compromise.
      await userStore.revokeAllSessions(user.id);
      reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions());

      return reply.code(204).send();
    },
  );
}
