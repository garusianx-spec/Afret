import argon2, { type HashOptions } from 'argon2';

import { toEnDigits } from './digits.js';

/**
 * Argon2id — the PHC-recommended choice, resistant to both GPU and
 * side-channel attack. Parameters follow OWASP's 2024 baseline: 19 MiB of
 * memory, 2 passes, 1 degree of parallelism.
 *
 * Tuning note: memory cost dominates. Raising `timeCost` is cheaper for an
 * attacker to amortise than raising `memoryCost`, so if this ever needs to be
 * slower, raise memory first.
 */
const OPTIONS: HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed hash in the database must read as "wrong password", never
    // as a 500 that tells an attacker the account exists.
    return false;
  }
}

export interface PasswordCheck {
  ok: boolean;
  /** Persian message, safe to show the user verbatim. */
  message?: string;
}

/** The 25 most common leaked passwords that also pass a naive length check. */
const BANNED = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwertyui',
  'qwerty123', '11111111', '00000000', 'iloveyou', 'abc12345', 'admin123',
  'welcome1', 'sunshine', 'princess', 'football', 'baseball', 'trustno1',
  'passw0rd', 'letmein1', 'monkey12', 'dragon12', 'master12', 'shadow12',
  'superman',
]);

/**
 * Password policy.
 *
 * Deliberately length-first rather than a symbol-class gauntlet: forcing
 * `P@ssw0rd!` patterns produces predictable passwords people write down. The
 * rules here are minimum length, a mix of letters and digits, no repetition,
 * and no top-of-the-leak-list entries.
 */
export function checkPasswordStrength(plain: string): PasswordCheck {
  const value = toEnDigits(plain ?? '');

  if (value.length < 8) {
    return { ok: false, message: 'رمز عبور باید حداقل ۸ نویسه باشد.' };
  }
  if (value.length > 128) {
    return { ok: false, message: 'رمز عبور نمی‌تواند بیش از ۱۲۸ نویسه باشد.' };
  }
  if (BANNED.has(value.toLowerCase())) {
    return { ok: false, message: 'این رمز عبور بسیار رایج است. رمز دیگری انتخاب کنید.' };
  }
  if (!/[0-9]/.test(value) || !/[A-Za-z؀-ۿ]/.test(value)) {
    return { ok: false, message: 'رمز عبور باید ترکیبی از حرف و عدد باشد.' };
  }
  if (/^(.)\1+$/.test(value)) {
    return { ok: false, message: 'رمز عبور نمی‌تواند تکرار یک نویسه باشد.' };
  }

  return { ok: true };
}
