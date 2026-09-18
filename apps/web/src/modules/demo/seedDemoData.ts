'use client';

import { jalaliDayKey } from '@/lib/jalali';
import { createId } from '@/lib/utils';
import { useChecklistStore } from '@/modules/home/store/checklistStore';
import { useToolkitStore } from '@/modules/profile/store/toolkitStore';
import {
  useHealthLogStore,
  type HealthLog,
} from '@/modules/tracker/store/healthLogStore';
import { useUserStore } from '@/stores/userStore';

/**
 * Sample data for the demo account.
 *
 * Health data lives in local stores (it is the user's own clinical record,
 * cached for offline use), so the seed runs client-side after the demo user
 * signs in. Everything is dated **relative to now**, not pinned to fixed
 * dates: a demo that says "week 18" must still say week 18 when it is opened
 * six months from now.
 *
 * Gated on the demo mobile number and guarded by a marker so it runs once and
 * never overwrites data the person entered while exploring.
 */

export const DEMO_MOBILE = '+989123456789';
const SEED_MARKER = 'afrat:demo-seeded-v1';

const DAY = 86_400_000;
const iso = (daysAgo: number, hour = 9, minute = 0) => {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const isoDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10);

/** 18 weeks + 2 days of gestation, counted back from today. */
const GESTATION_DAYS = 18 * 7 + 2;

function seedProfile() {
  const { profile, setProfile } = useUserStore.getState();

  setProfile({
    ...(profile ?? { cycleLength: 28, periodLength: 5 }),
    id: profile?.id ?? 'u_demo',
    displayName: 'مریم رضایی',
    mode: 'pregnancy',
    cycleLength: 28,
    periodLength: 5,
    lmpDate: isoDate(GESTATION_DAYS),
    // A dating ultrasound at 12w0d that agrees with the LMP, so the override
    // UI has something real to display without inventing a discrepancy.
    gestationalOverride: {
      measuredOn: isoDate(GESTATION_DAYS - 84),
      weeks: 12,
      days: 0,
      source: 'ultrasound',
      note: 'سونوگرافی تعیین سن — مطابق با LMP',
    },
  });
}

function seedHealthLogs() {
  const store = useHealthLogStore.getState();
  if (store.logs.length > 0) return;

  const logs: Omit<HealthLog, 'id'>[] = [
    // Weight: a steady, clinically unremarkable second-trimester gain.
    { kind: 'weight', at: iso(28, 8), value: 61.2 },
    { kind: 'weight', at: iso(21, 8), value: 61.8 },
    { kind: 'weight', at: iso(14, 8), value: 62.5 },
    { kind: 'weight', at: iso(7, 8), value: 63.1 },
    { kind: 'weight', at: iso(1, 8), value: 63.6 },

    // Glucose: mostly in range, with one post-meal reading over target so the
    // out-of-range styling is visible rather than theoretical.
    { kind: 'glucose', at: iso(6, 7, 30), value: 88, label: 'fasting' },
    { kind: 'glucose', at: iso(6, 14, 0), value: 126, label: 'oneHour' },
    { kind: 'glucose', at: iso(4, 7, 30), value: 91, label: 'fasting' },
    { kind: 'glucose', at: iso(4, 15, 0), value: 148, label: 'oneHour' },
    { kind: 'glucose', at: iso(2, 7, 30), value: 86, label: 'fasting' },
    { kind: 'glucose', at: iso(1, 16, 0), value: 112, label: 'twoHour' },

    // Blood pressure: normal, with one "elevated" row.
    { kind: 'bloodPressure', at: iso(5, 9), value: 112, value2: 72 },
    { kind: 'bloodPressure', at: iso(3, 9), value: 118, value2: 76 },
    { kind: 'bloodPressure', at: iso(1, 9), value: 131, value2: 84 },

    // Mood and nausea for today, so the pickers show a selection.
    { kind: 'mood', at: iso(0, 10), value: 4 },
    { kind: 'nausea', at: iso(0, 10), value: 1, label: 'خفیف' },
  ];

  logs.forEach((log) => store.add(log));
}

function seedChecklist() {
  const dayKey = jalaliDayKey(new Date());
  const { progress, toggle } = useChecklistStore.getState();
  if (progress[dayKey]) return;

  // Part-way through the day: the supplement taken, five glasses of water,
  // the walk done — enough for the ring to show real progress.
  toggle(dayKey, 'prenatal', 1);
  toggle(dayKey, 'walk', 1);
  for (let i = 0; i < 5; i += 1) toggle(dayKey, 'water', 8);
}

function seedToolkit() {
  const store = useToolkitStore.getState();
  if (store.memories.length > 0) return;

  store.addMemory({
    id: createId('mem'),
    title: 'اولین سونوگرافی',
    at: iso(84, 11),
    note: 'ضربان قلبش را شنیدیم — ۱۵۸ در دقیقه.',
  });
  store.addMemory({
    id: createId('mem'),
    title: 'اولین حرکت',
    at: iso(5, 22),
    note: 'شب، موقع خواب. مثل بال پروانه.',
  });

  // A few hospital-bag items ticked so the progress bar is not at zero.
  ['id-docs', 'file', 'baby-clothes', 'diapers'].forEach((id) =>
    store.toggleItem('hospital-bag', id),
  );
  ['crib', 'bodysuit', 'thermometer'].forEach((id) =>
    store.toggleItem('layette', id),
  );
}

/**
 * Runs once per browser for the demo account. Returns `true` if it seeded.
 *
 * Non-demo accounts are never touched — the mobile check is the only gate
 * that matters, and it is checked against the server-issued profile, not
 * anything the client can set for itself.
 */
export function seedDemoData(mobile: string): boolean {
  if (mobile !== DEMO_MOBILE) return false;

  try {
    if (localStorage.getItem(SEED_MARKER)) return false;
  } catch {
    // Private mode: seed anyway. Re-seeding a demo is harmless; the
    // individual seeders are each idempotent on their own store.
  }

  seedProfile();
  seedHealthLogs();
  seedChecklist();
  seedToolkit();

  try {
    localStorage.setItem(SEED_MARKER, new Date().toISOString());
  } catch {
    /* nothing to do — the per-store guards still prevent duplication */
  }
  return true;
}
