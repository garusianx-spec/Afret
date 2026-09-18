import { hashPassword } from './password.js';
import { normalizeMobile } from './mobile.js';
import { userStore } from './userStore.js';
import type { JourneyMode, RiskFlag, UserRole } from './types.js';

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
    note: 'پزشک — برای آزمودن گفتگوی مشاوره از دو طرف و پنل کلینیکی',
  },
];

/**
 * Additional demo patients, each given a real provisioned consult room with
 * the demo doctor above, so her patient list has more than one row to show.
 * `journeyMode`/`journeyWeek`/`riskFlag` are set directly here for the demo;
 * in production these come from the mother's own self-report
 * (`PATCH /api/profile/journey`) and the doctor's own flag
 * (`PATCH /api/doctor/patients/:id/flag`) — never fabricated automatically.
 */
interface DemoPatient {
  mobile: string;
  fullName: string;
  journeyMode: JourneyMode;
  journeyWeek: number;
  riskFlag: RiskFlag;
  riskFlagNote?: string;
  firstMessage: string;
}

export const DEMO_PATIENTS: DemoPatient[] = [
  {
    mobile: '09121110001',
    fullName: 'زهرا کریمی',
    journeyMode: 'pregnancy',
    journeyWeek: 32,
    riskFlag: 'urgent',
    riskFlagNote: 'فشار خون بالا در دو نوبت اخیر — نیاز به ویزیت زودتر',
    firstMessage: 'سلام دکتر، امروز فشارم رو گرفتم ۱۴۵ روی ۹۵ بود. نگران شدم.',
  },
  {
    mobile: '09121110002',
    fullName: 'نگین صادقی',
    journeyMode: 'pregnancy',
    journeyWeek: 24,
    riskFlag: 'watch',
    riskFlagNote: 'تست تحمل گلوکز را باید هفتهٔ آینده انجام دهد',
    firstMessage: 'سلام، نوبت تست قند بارداری من کِی هست؟',
  },
  {
    mobile: '09121110003',
    fullName: 'الهام باقری',
    journeyMode: 'ttc',
    journeyWeek: 3,
    riskFlag: 'normal',
    firstMessage: 'سلام دکتر، سوالی دربارهٔ زمان مناسب برای شروع اسید فولیک داشتم.',
  },
  {
    mobile: '09121110004',
    fullName: 'مینا توکلی',
    journeyMode: 'postpartum',
    journeyWeek: 6,
    riskFlag: 'normal',
    firstMessage: 'سلام، برنامهٔ واکسیناسیون دو ماهگی رو میخواستم بپرسم.',
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

  await seedDemoPatients(log);
}

async function seedDemoPatients(log: (message: string) => void): Promise<void> {
  const { messageStore } = await import('../store/messageStore.js');
  const { toChatUser } = await import('./middleware.js');
  const { permissionsFor, ROLE_LABELS } = await import('./types.js');

  const doctorMobile = normalizeMobile('09123456780')!;
  const doctor = await userStore.findByMobile(doctorMobile);
  if (!doctor) return; // demo accounts disabled — nothing to wire up

  for (const patientSeed of DEMO_PATIENTS) {
    const mobile = normalizeMobile(patientSeed.mobile);
    if (!mobile) continue;

    let patient = await userStore.findByMobile(mobile);
    if (!patient) {
      patient = await userStore.create({
        mobile,
        passwordHash: await hashPassword('Afrat1404'),
        fullName: patientSeed.fullName,
        role: 'mother',
      });
      await userStore.update(patient.id, {
        mobileVerified: true,
        journeyMode: patientSeed.journeyMode,
        journeyWeek: patientSeed.journeyWeek,
        riskFlag: patientSeed.riskFlag,
        riskFlagNote: patientSeed.riskFlagNote,
        riskFlagSetAt: new Date().toISOString(),
      });
      log(`Seeded demo patient: ${patientSeed.mobile} (${patientSeed.fullName})`);
    }

    const room = await messageStore.createConsultRoom(
      toChatUser({
        id: patient.id,
        mobile: patient.mobile,
        role: patient.role,
        roleLabel: ROLE_LABELS[patient.role],
        permissions: permissionsFor(patient.role),
        displayName: patient.fullName ?? patientSeed.fullName,
      }),
      toChatUser({
        id: doctor.id,
        mobile: doctor.mobile,
        role: doctor.role,
        roleLabel: ROLE_LABELS[doctor.role],
        permissions: permissionsFor(doctor.role),
        displayName: doctor.fullName ?? 'پزشک',
      }),
    );

    // A one-line opener from the patient, so the doctor's inbox previews
    // something real instead of the generic welcome system message.
    await messageStore.append(
      { clientId: `seed_${patient.id}_msg1`, roomId: room.id, kind: 'text', body: patientSeed.firstMessage },
      toChatUser({
        id: patient.id,
        mobile: patient.mobile,
        role: patient.role,
        roleLabel: ROLE_LABELS[patient.role],
        permissions: permissionsFor(patient.role),
        displayName: patient.fullName ?? patientSeed.fullName,
      }),
    );
  }
}
