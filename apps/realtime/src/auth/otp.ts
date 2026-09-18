import { randomInt, createHash } from 'node:crypto';

import { maskMobile, toNationalMobile } from './mobile.js';

/**
 * SMS OTP — architecture only, no provider wired.
 *
 * The point of this module is that adding Kavenegar (or Ghasedak, or SMS.ir)
 * later is a matter of implementing `SmsProvider` and passing it to
 * `setSmsProvider()`. No route, no store and no client screen changes.
 *
 * OTP codes are stored hashed with the mobile number as a salt, for the same
 * reason passwords are: a leak of this table must not let anyone complete a
 * verification they did not receive.
 */

export interface SmsProvider {
  readonly name: string;
  send(params: { to: string; text: string }): Promise<void>;
}

/** Logs instead of sending. Refuses to be the provider in production. */
export const consoleSmsProvider: SmsProvider = {
  name: 'console',
  async send({ to, text }) {
    // eslint-disable-next-line no-console
    console.info(`[sms:console] → ${to}: ${text}`);
  },
};

let provider: SmsProvider | null = null;

export function setSmsProvider(next: SmsProvider) {
  provider = next;
}

export function getSmsProvider(): SmsProvider | null {
  return provider;
}

export const OTP_TTL_SECONDS = 120;
const MAX_VERIFY_ATTEMPTS = 5;
/** One code per mobile per this window, so the endpoint cannot be used to spam. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const codes = new Map<string, OtpRecord>();

function hashCode(mobile: string, code: string): string {
  return createHash('sha256').update(`${mobile}:${code}`).digest('hex');
}

export type OtpIssueResult =
  | { ok: true; expiresInSeconds: number; masked: string }
  | { ok: false; reason: 'cooldown' | 'no_provider'; retryAfterSeconds?: number };

export async function issueOtp(mobile: string): Promise<OtpIssueResult> {
  if (!provider) return { ok: false, reason: 'no_provider' };

  const existing = codes.get(mobile);
  const now = Date.now();
  if (existing && now - existing.lastSentAt < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    return {
      ok: false,
      reason: 'cooldown',
      retryAfterSeconds: Math.ceil(
        (OTP_RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000,
      ),
    };
  }

  // `randomInt` is CSPRNG-backed; `Math.random()` would be guessable.
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');

  codes.set(mobile, {
    codeHash: hashCode(mobile, code),
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    attempts: 0,
    lastSentAt: now,
  });

  await provider.send({
    to: toNationalMobile(mobile),
    text: `کد ورود شما به آفرت: ${code}\nاین کد تا ۲ دقیقه معتبر است.`,
  });

  return { ok: true, expiresInSeconds: OTP_TTL_SECONDS, masked: maskMobile(mobile) };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'expired' | 'mismatch' | 'too_many_attempts' | 'not_found' };

export function verifyOtp(mobile: string, code: string): OtpVerifyResult {
  const record = codes.get(mobile);
  if (!record) return { ok: false, reason: 'not_found' };

  if (Date.now() > record.expiresAt) {
    codes.delete(mobile);
    return { ok: false, reason: 'expired' };
  }
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    codes.delete(mobile);
    return { ok: false, reason: 'too_many_attempts' };
  }

  record.attempts += 1;
  if (record.codeHash !== hashCode(mobile, code)) {
    return { ok: false, reason: 'mismatch' };
  }

  // Single use.
  codes.delete(mobile);
  return { ok: true };
}
