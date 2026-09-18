'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
  /** Items with a target render as a counter (e.g. 8 glasses of water). */
  target?: number;
  unit?: string;
}

export const DAILY_ITEMS: Record<string, ChecklistItem[]> = {
  pregnancy: [
    { id: 'prenatal', label: 'مصرف مکمل بارداری', hint: 'اسید فولیک / آهن' },
    { id: 'water', label: 'نوشیدن آب', target: 8, unit: 'لیوان' },
    { id: 'walk', label: 'پیاده‌روی سبک', hint: '۲۰ تا ۳۰ دقیقه' },
    { id: 'kicks', label: 'ثبت حرکات جنین', hint: 'بعد از هفتهٔ ۲۸' },
    { id: 'symptoms', label: 'ثبت علائم امروز' },
  ],
  ttc: [
    { id: 'folic', label: 'مصرف اسید فولیک' },
    { id: 'bbt', label: 'ثبت دمای پایهٔ بدن' },
    { id: 'water', label: 'نوشیدن آب', target: 8, unit: 'لیوان' },
    { id: 'symptoms', label: 'ثبت علائم چرخه' },
  ],
  cycle: [
    { id: 'water', label: 'نوشیدن آب', target: 8, unit: 'لیوان' },
    { id: 'mood', label: 'ثبت حال و خلق‌وخو' },
    { id: 'skin', label: 'وضعیت پوست' },
    { id: 'cramps', label: 'شدت درد قاعدگی' },
    { id: 'energy', label: 'سطح انرژی امروز' },
  ],
  postpartum: [
    { id: 'vitamin', label: 'مصرف مکمل شیردهی' },
    { id: 'water', label: 'نوشیدن آب', target: 10, unit: 'لیوان' },
    { id: 'feed', label: 'ثبت وعده‌های شیردهی' },
    { id: 'tummy', label: 'زمان روی شکم نوزاد', hint: 'حداقل ۱۵ دقیقه' },
    { id: 'rest', label: 'استراحت هم‌زمان با خواب نوزاد' },
  ],
};

interface ChecklistState {
  /** `{ '1404-06-26': { water: 3, prenatal: 1 } }` — keyed by Jalali day. */
  progress: Record<string, Record<string, number>>;
  toggle: (dayKey: string, itemId: string, target?: number) => void;
  reset: (dayKey: string) => void;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set) => ({
      progress: {},
      toggle: (dayKey, itemId, target = 1) =>
        set((state) => {
          const day = state.progress[dayKey] ?? {};
          const current = day[itemId] ?? 0;
          // Counters increment then wrap to zero once the target is met, so a
          // mis-tap is one more tap to undo rather than a long-press menu.
          const next = current >= target ? 0 : current + 1;
          return {
            progress: { ...state.progress, [dayKey]: { ...day, [itemId]: next } },
          };
        }),
      reset: (dayKey) =>
        set((state) => {
          const { [dayKey]: _removed, ...rest } = state.progress;
          return { progress: rest };
        }),
    }),
    {
      name: 'afrat-checklist',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
