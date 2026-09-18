import { hashPassword } from './password.js';
import { normalizeMobile } from './mobile.js';
import { userStore } from './userStore.js';
import type { UserRole } from './types.js';

/**
 * Pre-seeded demo accounts.
 *
 * These exist so the app can be opened and inspected without registering, and
 * the credentials are documented in the README. That is exactly why they are
 * **refused in production unless explicitly opted into**: a known mobile and a
 * published password on a live maternal-health service is not a convenience,
 * it is an open door. Set `ALLOW_DEMO_ACCOUNTS=true` only on a staging box you
 * are comfortable handing to anyone who reads the repo.
 */
export interface DemoAccount {
  mobile: string;
  password: string;
  fullName: string;
  role: UserRole;
  note: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    mobile: '09123456789',
    password: 'Afrat1404',
    fullName: 'مریم رضایی',
    role: 'mother',
    note: 'مادر باردار — هفتهٔ ۱۸، با داده‌های نمونه در همهٔ تب‌ها',
  },
  {
    // The other side of the consultation room, so the chat tab has a real
    // counterpart to log in as rather than a one-sided transcript.
    mobile: '09123456780',
    password: 'Afrat1404',
    fullName: 'دکتر سارا احمدی',
    role: 'doctor',
    note: 'پزشک — برای آزمودن گفتگوی مشاوره از دو طرف',
  },
];

export function demoAccountsEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.ALLOW_DEMO_ACCOUNTS === 'true';
}

/**
 * Idempotent: an existing account is left alone, so a password changed during
 * testing is not silently reset on the next restart.
 */
export async function seedDemoAccounts(
  log: (message: string) => void = () => {},
): Promise<void> {
  if (!demoAccountsEnabled()) {
    log('Demo accounts are disabled in production (set ALLOW_DEMO_ACCOUNTS=true to override).');
    return;
  }

  for (const account of DEMO_ACCOUNTS) {
    const mobile = normalizeMobile(account.mobile);
    if (!mobile) continue;

    if (await userStore.findByMobile(mobile)) {
      log(`Demo account already present: ${account.mobile}`);
      continue;
    }

    const user = await userStore.create({
      mobile,
      passwordHash: await hashPassword(account.password),
      fullName: account.fullName,
      role: account.role,
    });

    // Demo accounts skip SMS verification — there is no provider wired, and
    // an unverified badge on every screenshot is noise.
    await userStore.update(user.id, { mobileVerified: true });

    log(`Seeded demo account: ${account.mobile} / ${account.password} (${account.role})`);
  }
}
