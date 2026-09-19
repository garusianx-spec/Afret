'use client';

import { CalendarPlus } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliLong, jalaliShort } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';
import { PHASE_LABELS, resolveCycle } from '@/modules/tracker/lib/cycle';
import { cycleLengthHistory, usePeriodLogStore } from '@/modules/tracker/store/periodLogStore';
import { useUserStore } from '@/stores/userStore';

import { TrackerStat } from './TrackerStat';

/**
 * Mode A — عادی و پیگیری چرخه: تقویم قاعدگی، تاریخچهٔ طول چرخه، ثبت پریود.
 * عمداً بدون پیش‌بینی تخمک‌گذاری/پنجرهٔ باروری — آن‌ها مخصوص حالت TTC است.
 */
export function PeriodTrackerContent() {
  const profile = useUserStore((s) => s.profile);
  const patchProfile = useUserStore((s) => s.patchProfile);
  const cycle = profile ? resolveCycle(profile) : null;
  const entries = usePeriodLogStore((s) => s.entries);
  const logStart = usePeriodLogStore((s) => s.logStart);
  const history = cycleLengthHistory(entries);

  return (
    <>
      <Card id="cycle">
        <CardTitle action={cycle ? <Chip tone="primary">{PHASE_LABELS[cycle.phase]}</Chip> : null}>
          تقویم قاعدگی
        </CardTitle>

        {cycle ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <TrackerStat term="روز چرخه" value={toFaDigits(cycle.day)} />
            <TrackerStat term="طول چرخهٔ متوسط" value={`${toFaDigits(cycle.cycleLength)} روز`} />
            <div className="col-span-2 rounded-xl bg-primary-100 p-3 text-xs leading-6 text-ink">
              پیش‌بینی قاعدگی بعدی: <strong>{jalaliLong(cycle.nextPeriodDate)}</strong>
            </div>
          </dl>
        ) : (
          <p className="text-sm leading-7 text-ink-muted">
            برای فعال شدن پیش‌بینی، اولین پریود خود را ثبت کنید.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            logStart(today);
            patchProfile({ lmpDate: today });
          }}
          className="afrat-tap mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-primary-deep px-4 py-2.5 text-sm font-bold text-white"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          ثبت شروع پریود امروز
        </button>
      </Card>

      <Card id="period-history">
        <CardTitle>تاریخچهٔ طول چرخه</CardTitle>
        {history.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {history.slice(0, 6).map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs"
              >
                <span className="text-ink-muted">
                  {jalaliShort(h.from)} تا {jalaliShort(h.to)}
                </span>
                <Chip tone="neutral">{toFaDigits(h.days)} روز</Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-faint">
            پس از ثبت دومین پریود، طول چرخه‌ها اینجا محاسبه می‌شود.
          </p>
        )}

        {entries.length > 0 ? (
          <>
            <p className="mb-1.5 mt-4 text-[11px] font-bold text-primary-deep">ثبت‌های پریود</p>
            <ul className="flex flex-wrap gap-1.5">
              {entries.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Chip tone="coral">{jalaliShort(e.startDate)}</Chip>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    </>
  );
}
