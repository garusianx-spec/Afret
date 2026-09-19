'use client';

import { Waves } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliLong } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';
import { BbtLogger, CervicalMucusLogger } from '@/modules/tracker/components/FertilityLoggers';
import { PHASE_LABELS, resolveCycle } from '@/modules/tracker/lib/cycle';
import { useUserStore } from '@/stores/userStore';

import { TrackerStat } from './TrackerStat';

/**
 * Mode B — تلاش برای بارداری: پیش‌بینی تخمک‌گذاری، پنجرهٔ باروری، محاسبهٔ
 * فاز لوتئال، به‌علاوهٔ ثبت BBT و ترشحات دهانهٔ رحم.
 */
export function TtcTrackerContent() {
  const profile = useUserStore((s) => s.profile);
  const patchProfile = useUserStore((s) => s.patchProfile);
  const cycle = profile ? resolveCycle(profile) : null;

  return (
    <>
      <Card id="fertility">
        <CardTitle
          action={
            cycle?.isFertileToday ? (
              <Chip tone="mint">
                <Waves className="size-3.5" aria-hidden="true" />
                امروز باروری بالاست
              </Chip>
            ) : cycle ? (
              <Chip tone="primary">{PHASE_LABELS[cycle.phase]}</Chip>
            ) : null
          }
        >
          پیش‌بینی باروری
        </CardTitle>

        {cycle ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <TrackerStat term="روز چرخه" value={toFaDigits(cycle.day)} />
            <TrackerStat term="تخمک‌گذاری" value={jalaliLong(cycle.ovulationDate)} />
            <div className="col-span-2 rounded-xl bg-mint-soft p-3 text-xs leading-6 text-ink">
              پنجرهٔ باروری: {jalaliLong(cycle.fertileWindow.start)} تا{' '}
              {jalaliLong(cycle.fertileWindow.end)}
            </div>
            <div className="col-span-2 rounded-xl bg-surface p-3 text-xs leading-6 text-ink-muted">
              فاز لوتئال (تخمین): ۱۴ روز پس از تخمک‌گذاری — قاعدگی بعدی{' '}
              {jalaliLong(cycle.nextPeriodDate)}
            </div>
          </dl>
        ) : (
          <p className="text-sm leading-7 text-ink-muted">
            برای پیش‌بینی پنجرهٔ باروری، اولین روز آخرین قاعدگی را ثبت کنید.
          </p>
        )}

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-muted">
            اولین روز آخرین قاعدگی (میلادی)
          </span>
          <input
            type="date"
            value={profile?.lmpDate ?? ''}
            onChange={(event) => patchProfile({ lmpDate: event.target.value })}
            className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      </Card>

      <BbtLogger />
      <CervicalMucusLogger />
    </>
  );
}
