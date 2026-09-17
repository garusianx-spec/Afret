'use client';

import { BellRing, Check, Syringe } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliLong } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';
import type { BabyProfile } from '@/types';

import { VACCINE_SCHEDULE, MILESTONES } from '../data/vaccinations';
import { babyAge } from '../lib/cycle';

/** Date a dose falls due, derived from the baby's birth date. */
function dueDateFor(birthDate: string, ageMonths: number): Date {
  const birth = new Date(birthDate);
  return new Date(
    Date.UTC(
      birth.getUTCFullYear(),
      birth.getUTCMonth() + ageMonths,
      birth.getUTCDate(),
    ),
  );
}

export function VaccineSchedule({ baby }: { baby: BabyProfile }) {
  const { months } = babyAge(baby.birthDate);

  return (
    <Card id="vaccines">
      <CardTitle
        action={
          <Chip tone="primary">
            <BellRing className="size-3.5" aria-hidden="true" />
            یادآوری فعال
          </Chip>
        }
      >
        برنامهٔ واکسیناسیون
      </CardTitle>

      <ol className="flex flex-col">
        {VACCINE_SCHEDULE.map((dose, index) => {
          const due = dueDateFor(baby.birthDate, dose.ageMonths);
          const done = months > dose.ageMonths;
          const current = months === dose.ageMonths;

          return (
            <li key={dose.id} className="flex gap-3">
              {/* Timeline rail */}
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                    done
                      ? 'border-mint bg-mint text-white'
                      : current
                        ? 'border-primary-deep bg-primary/15 text-primary-deep'
                        : 'border-surface-border bg-surface-card text-ink-faint',
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Syringe className="size-3.5" />
                  )}
                </span>
                {index < VACCINE_SCHEDULE.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'w-0.5 flex-1',
                      done ? 'bg-mint/40' : 'bg-surface-border',
                    )}
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pb-4">
                <p
                  className={cn(
                    'text-sm font-medium',
                    done ? 'text-ink-faint' : 'text-ink',
                  )}
                >
                  {dose.name}
                </p>
                <p className="text-[11px] leading-5 text-ink-muted">
                  {dose.protects} · {dose.route}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  {dose.ageMonths === 0
                    ? 'بدو تولد'
                    : `${toFaDigits(dose.ageMonths)} ماهگی`}{' '}
                  — {jalaliLong(due)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

export function MilestoneList({ baby }: { baby: BabyProfile }) {
  const { months } = babyAge(baby.birthDate);

  return (
    <Card id="milestones">
      <CardTitle>مهارت‌های رشدی</CardTitle>

      <ul className="flex flex-col gap-2">
        {MILESTONES.map((milestone) => {
          const reached = months >= milestone.ageMonths;
          const overdue = months > milestone.concernIfMissingByMonths;

          return (
            <li
              key={milestone.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink">{milestone.title}</p>
                <p className="text-[11px] text-ink-faint">
                  معمولاً در {toFaDigits(milestone.ageMonths)} ماهگی
                </p>
              </div>
              <Chip tone={overdue ? 'coral' : reached ? 'mint' : 'neutral'}>
                {overdue ? 'با پزشک مشورت کنید' : reached ? 'در بازهٔ مورد انتظار' : 'در آینده'}
              </Chip>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] leading-5 text-ink-faint">
        هر کودک ریتم خودش را دارد. این فهرست جایگزین معاینهٔ پزشک نیست.
      </p>
    </Card>
  );
}
