'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';
import { formatFa, formatFaTime, toEnDigits, toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import {
  bloodPressureFlag,
  GLUCOSE_TARGETS,
  isGlucoseHigh,
  useHealthLogStore,
  type GlucoseContext,
  type HealthLog,
} from '../store/healthLogStore';

const MOODS = ['😞', '😕', '🙂', '😊', '🤩'];
const NAUSEA = ['ندارم', 'خفیف', 'متوسط', 'شدید', 'خیلی شدید'];

export function WeightLogger() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter((l) => l.kind === 'weight');
  const [value, setValue] = useState('');

  const latest = logs[0];
  const previous = logs[1];
  const delta = latest && previous ? latest.value - previous.value : 0;

  return (
    <Card id="weight">
      <CardTitle
        action={
          latest ? (
            <Chip tone={delta > 0 ? 'coral' : delta < 0 ? 'primary' : 'neutral'}>
              {delta === 0
                ? 'بدون تغییر'
                : `${delta > 0 ? '+' : '−'}${formatFa(Math.abs(delta), {
                    maximumFractionDigits: 1,
                  })} کیلوگرم`}
            </Chip>
          ) : null
        }
      >
        وزن
      </CardTitle>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(toEnDigits(value));
          if (!Number.isFinite(parsed) || parsed < 30 || parsed > 200) return;
          add({ kind: 'weight', at: new Date().toISOString(), value: parsed });
          setValue('');
        }}
      >
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={latest ? formatFa(latest.value) : 'مثلاً ۶۸٫۵'}
          aria-label="وزن بر حسب کیلوگرم"
          className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm tabular-nums focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="afrat-tap flex size-11 items-center justify-center rounded-xl bg-primary-deep text-white"
          aria-label="ثبت وزن"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>

      <LogList logs={logs.slice(0, 4)} render={(l) => `${formatFa(l.value)} کیلوگرم`} />
    </Card>
  );
}

export function GlucoseLogger() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter((l) => l.kind === 'glucose');
  const [value, setValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>('fasting');

  return (
    <Card id="glucose">
      <CardTitle>قند خون — پایش دیابت بارداری</CardTitle>

      <div
        role="radiogroup"
        aria-label="زمان اندازه‌گیری"
        className="mb-3 flex gap-1.5"
      >
        {(Object.keys(GLUCOSE_TARGETS) as GlucoseContext[]).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={context === key}
            onClick={() => setContext(key)}
            className={cn(
              'afrat-tap flex-1 rounded-pill px-2 py-1.5 text-[11px] font-medium transition',
              context === key
                ? 'bg-primary-deep text-white'
                : 'bg-surface text-ink-muted',
            )}
          >
            {GLUCOSE_TARGETS[key].label}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(toEnDigits(value));
          if (!Number.isFinite(parsed) || parsed < 40 || parsed > 400) return;
          add({
            kind: 'glucose',
            at: new Date().toISOString(),
            value: parsed,
            label: context,
          });
          setValue('');
        }}
      >
        <input
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={`هدف: زیر ${toFaDigits(GLUCOSE_TARGETS[context].max)}`}
          aria-label="قند خون بر حسب میلی‌گرم بر دسی‌لیتر"
          className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm tabular-nums focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="afrat-tap flex size-11 items-center justify-center rounded-xl bg-primary-deep text-white"
          aria-label="ثبت قند خون"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>

      <LogList
        logs={logs.slice(0, 4)}
        render={(l) => `${toFaDigits(l.value)} — ${GLUCOSE_TARGETS[(l.label ?? 'fasting') as GlucoseContext].label}`}
        toneFor={(l) =>
          isGlucoseHigh(l.value, (l.label ?? 'fasting') as GlucoseContext)
            ? 'coral'
            : 'mint'
        }
      />
    </Card>
  );
}

export function BloodPressureLogger() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter(
    (l) => l.kind === 'bloodPressure',
  );
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');

  return (
    <Card id="pressure">
      <CardTitle>فشار خون</CardTitle>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const sys = Number(toEnDigits(systolic));
          const dia = Number(toEnDigits(diastolic));
          if (!Number.isFinite(sys) || !Number.isFinite(dia)) return;
          if (sys < 60 || sys > 250 || dia < 30 || dia > 160) return;
          add({
            kind: 'bloodPressure',
            at: new Date().toISOString(),
            value: sys,
            value2: dia,
          });
          setSystolic('');
          setDiastolic('');
        }}
      >
        <input
          inputMode="numeric"
          value={systolic}
          onChange={(event) => setSystolic(event.target.value)}
          placeholder="سیستول"
          aria-label="فشار سیستولیک"
          className="w-0 flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-center text-sm tabular-nums focus:border-primary focus:outline-none"
        />
        <span aria-hidden="true" className="text-ink-faint">
          /
        </span>
        <input
          inputMode="numeric"
          value={diastolic}
          onChange={(event) => setDiastolic(event.target.value)}
          placeholder="دیاستول"
          aria-label="فشار دیاستولیک"
          className="w-0 flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-center text-sm tabular-nums focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="afrat-tap flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-deep text-white"
          aria-label="ثبت فشار خون"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>

      <LogList
        logs={logs.slice(0, 4)}
        render={(l) => `${toFaDigits(l.value)}/${toFaDigits(l.value2 ?? 0)}`}
        toneFor={(l) => {
          const flag = bloodPressureFlag(l.value, l.value2 ?? 0);
          return flag === 'high' ? 'coral' : flag === 'elevated' ? 'neutral' : 'mint';
        }}
      />

      <p className="mt-3 text-[11px] leading-5 text-ink-faint">
        فشار ۱۴۰/۹۰ یا بالاتر در بارداری باید سریعاً به پزشک اطلاع داده شود.
      </p>
    </Card>
  );
}

export function MoodAndNauseaLogger() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs);
  const todayKey = new Date().toISOString().slice(0, 10);

  const todayMood = logs.find(
    (l) => l.kind === 'mood' && l.at.slice(0, 10) === todayKey,
  );
  const todayNausea = logs.find(
    (l) => l.kind === 'nausea' && l.at.slice(0, 10) === todayKey,
  );

  return (
    <Card id="symptoms">
      <CardTitle>حال امروز</CardTitle>

      <fieldset className="mb-4">
        <legend className="mb-2 text-xs font-medium text-ink-muted">
          حال و خلق‌وخو
        </legend>
        <div className="flex justify-between gap-1">
          {MOODS.map((emoji, index) => {
            const selected = todayMood?.value === index + 1;
            return (
              <button
                key={emoji}
                type="button"
                aria-pressed={selected}
                aria-label={`حال شمارهٔ ${toFaDigits(index + 1)} از ${toFaDigits(MOODS.length)}`}
                onClick={() =>
                  add({ kind: 'mood', at: new Date().toISOString(), value: index + 1 })
                }
                className={cn(
                  'afrat-tap flex size-12 items-center justify-center rounded-2xl text-2xl transition',
                  selected ? 'bg-primary/20 ring-2 ring-primary-deep' : 'bg-surface',
                )}
              >
                <span aria-hidden="true">{emoji}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-ink-muted">
          شدت تهوع صبحگاهی
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {NAUSEA.map((label, index) => {
            const selected = todayNausea?.value === index;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  add({
                    kind: 'nausea',
                    at: new Date().toISOString(),
                    value: index,
                    label,
                  })
                }
                className={cn(
                  'afrat-tap rounded-pill px-3 py-1.5 text-xs font-medium transition',
                  selected
                    ? 'bg-coral text-ink'
                    : 'bg-surface text-ink-muted',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function LogList({
  logs,
  render,
  toneFor,
}: {
  logs: HealthLog[];
  render: (log: HealthLog) => string;
  toneFor?: (log: HealthLog) => 'mint' | 'coral' | 'neutral' | 'primary';
}) {
  if (logs.length === 0) {
    return (
      <p className="mt-3 text-xs text-ink-faint">هنوز موردی ثبت نشده است.</p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs"
        >
          <span className="text-ink-muted">
            {jalaliShort(log.at)} · {formatFaTime(log.at)}
          </span>
          <Chip tone={toneFor?.(log) ?? 'neutral'}>{render(log)}</Chip>
        </li>
      ))}
    </ul>
  );
}
