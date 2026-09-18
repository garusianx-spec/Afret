'use client';

import { useState } from 'react';
import { Plus, Waves } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';
import { formatFa, formatFaUnit, toEnDigits, toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import { MUCUS_SCALE, useHealthLogStore } from '../store/healthLogStore';

/**
 * Basal body temperature — the TTC-mode logger.
 *
 * BBT rises ~0.3–0.5°C after ovulation and stays up through the luteal
 * phase; charted daily, that shift is what confirms ovulation happened (as
 * opposed to predicting it, which is what the fertile-window card does).
 */
export function BbtLogger() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter((l) => l.kind === 'bbt');
  const [value, setValue] = useState('');

  const latest = logs[0];
  const baseline =
    logs.length >= 3
      ? logs.slice(1, 4).reduce((sum, l) => sum + l.value, 0) / Math.min(3, logs.length - 1)
      : undefined;
  const shifted = latest && baseline && latest.value - baseline >= 0.25;

  return (
    <Card id="bbt">
      <CardTitle
        action={
          shifted ? (
            <Chip tone="mint">
              <Waves className="size-3.5" aria-hidden="true" />
              افزایش دما — احتمال تخمک‌گذاری
            </Chip>
          ) : null
        }
      >
        دمای پایه بدن (BBT)
      </CardTitle>

      <p className="mb-3 text-[11px] leading-5 text-ink-faint">
        بلافاصله پس از بیدار شدن و پیش از هر فعالیتی، با دماسنج دیجیتال دقیق
        اندازه بگیرید.
      </p>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(toEnDigits(value));
          if (!Number.isFinite(parsed) || parsed < 35 || parsed > 39) return;
          add({ kind: 'bbt', at: new Date().toISOString(), value: parsed });
          setValue('');
        }}
      >
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={latest ? formatFa(latest.value, { maximumFractionDigits: 2 }) : 'مثلاً ۳۶٫۵۰'}
          aria-label="دمای پایه بدن بر حسب درجهٔ سانتی‌گراد"
          className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm tabular-nums focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="afrat-tap flex size-11 items-center justify-center rounded-xl bg-primary-deep text-white"
          aria-label="ثبت دما"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>

      {logs.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {logs.slice(0, 5).map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs"
            >
              <span className="text-ink-muted">{jalaliShort(log.at)}</span>
              <Chip tone="neutral">{formatFaUnit(log.value, '°C', 2)}</Chip>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-ink-faint">هنوز دمایی ثبت نشده است.</p>
      )}
    </Card>
  );
}

/** Cervical mucus consistency — the other half of the TTC fertility signs. */
export function CervicalMucusLogger() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter((l) => l.kind === 'cervicalMucus');
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = logs.find((l) => l.at.slice(0, 10) === todayKey);

  return (
    <Card id="mucus">
      <CardTitle>ترشحات دهانهٔ رحم</CardTitle>
      <p className="mb-3 text-[11px] leading-5 text-ink-faint">
        نزدیک به تخمک‌گذاری، ترشحات شفاف‌تر و کِشدارتر می‌شوند.
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {MUCUS_SCALE.map((option) => {
          const selected = today?.value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                add({
                  kind: 'cervicalMucus',
                  at: new Date().toISOString(),
                  value: option.value,
                  label: option.label,
                })
              }
              className={cn(
                'afrat-tap rounded-xl px-3 py-2.5 text-xs font-medium transition',
                selected ? 'bg-primary-deep text-white' : 'bg-surface text-ink-muted',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * Fetal kick counter — pregnancy mode, third trimester.
 *
 * The clinical convention this mirrors: count to ten movements and note how
 * long it took. A session taking much longer than the mother's usual is the
 * signal to call a clinician, not the raw count.
 */
export function KickCounter() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter((l) => l.kind === 'kickCount');
  const [count, setCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const elapsedMin = startedAt ? Math.floor((Date.now() - startedAt) / 60000) : 0;

  const finish = () => {
    if (count === 0) {
      setStartedAt(null);
      return;
    }
    add({
      kind: 'kickCount',
      at: new Date().toISOString(),
      value: count,
      value2: startedAt ? Math.round((Date.now() - startedAt) / 60000) : undefined,
    });
    setCount(0);
    setStartedAt(null);
  };

  return (
    <Card id="kicks">
      <CardTitle>شمارش حرکات جنین</CardTitle>
      <p className="mb-3 text-[11px] leading-5 text-ink-faint">
        شمارش را با اولین حرکت شروع کنید. رسیدن به ۱۰ حرکت طی حدود دو ساعت
        طبیعی است؛ اگر کندتر شد، به پزشک اطلاع دهید.
      </p>

      <div className="flex items-center justify-center gap-6 py-4">
        <button
          type="button"
          onClick={() => {
            if (!startedAt) setStartedAt(Date.now());
            setCount((c) => c + 1);
          }}
          className="afrat-tap flex size-24 flex-col items-center justify-center gap-1 rounded-full bg-primary-deep text-white shadow-raised active:scale-95"
        >
          <span className="text-3xl font-bold tabular-nums">{toFaDigits(count)}</span>
          <span className="text-[11px]">ثبت حرکت</span>
        </button>

        <div className="flex flex-col gap-2 text-center">
          <span className="text-xs text-ink-muted">
            {startedAt ? `${toFaDigits(elapsedMin)} دقیقه` : 'شروع نشده'}
          </span>
          {count > 0 ? (
            <button
              type="button"
              onClick={finish}
              className="afrat-tap rounded-pill border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-muted"
            >
              پایان و ثبت
            </button>
          ) : null}
        </div>
      </div>

      {logs.length > 0 ? (
        <ul className="flex flex-col gap-1.5 border-t border-surface-border pt-3">
          {logs.slice(0, 4).map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs"
            >
              <span className="text-ink-muted">{jalaliShort(log.at)}</span>
              <Chip tone="mint">
                {toFaDigits(log.value)} حرکت
                {log.value2 ? ` در ${toFaDigits(log.value2)} دقیقه` : ''}
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
