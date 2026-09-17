'use client';

import { useState } from 'react';
import { CalendarCheck, Info, Pencil } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliLong } from '@/lib/jalali';
import { formatGestational, toEnDigits, toFaDigits } from '@/lib/persian';
import { useUserStore } from '@/stores/userStore';
import type { GestationalOverride } from '@/types';

import {
  dueDateFromOverride,
  gestationFromLmp,
  OVERRIDE_SOURCE_LABELS,
  resolveGestation,
} from '../lib/gestation';

/**
 * Lets the mother replace the LMP-derived gestational age with a clinician's
 * measurement. This is the single most requested correction in maternity
 * apps: an irregular cycle can put the LMP estimate a full week off, which
 * shifts every screening window downstream.
 */
export function GestationOverrideCard() {
  const profile = useUserStore((s) => s.profile);
  const setOverride = useUserStore((s) => s.setGestationalOverride);
  const patchProfile = useUserStore((s) => s.patchProfile);

  const [editing, setEditing] = useState(false);

  if (!profile) return null;

  const resolved = resolveGestation(profile);
  const lmpBased = profile.lmpDate ? gestationFromLmp(profile.lmpDate) : null;
  const override = profile.gestationalOverride;

  // Only worth flagging when the two estimates actually disagree.
  const driftDays =
    override && lmpBased && resolved
      ? resolved.totalDays - lmpBased.totalDays
      : 0;

  return (
    <Card id="gestation">
      <CardTitle
        action={
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="afrat-tap flex items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-deep"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            {override ? 'ویرایش' : 'اصلاح سن بارداری'}
          </button>
        }
      >
        سن بارداری
      </CardTitle>

      {resolved ? (
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-bold text-ink">
            {formatGestational(resolved.weeks, resolved.days)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone={resolved.basis === 'override' ? 'mint' : 'primary'}>
              <CalendarCheck className="size-3.5" aria-hidden="true" />
              {resolved.basis === 'override'
                ? OVERRIDE_SOURCE_LABELS[override!.source]
                : resolved.basis === 'lmp'
                  ? 'بر پایهٔ LMP'
                  : 'بر پایهٔ تاریخ زایمان'}
            </Chip>
            <Chip tone="neutral">
              زایمان: {jalaliLong(resolved.dueDate)}
            </Chip>
          </div>

          {driftDays !== 0 ? (
            <p className="flex items-start gap-1.5 rounded-xl bg-coral-soft p-2.5 text-xs leading-6 text-ink">
              <Info className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                این تاریخ {toFaDigits(Math.abs(driftDays))} روز با محاسبهٔ LMP
                تفاوت دارد. محاسبهٔ سونوگرافی مبنا قرار گرفته است.
              </span>
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm leading-7 text-ink-muted">
          هنوز اطلاعاتی ثبت نشده است. تاریخ LMP یا نتیجهٔ سونوگرافی را وارد کنید.
        </p>
      )}

      {editing ? (
        <OverrideForm
          initial={override}
          lmpDate={profile.lmpDate}
          onCancel={() => setEditing(false)}
          onClear={() => {
            setOverride(undefined);
            setEditing(false);
          }}
          onSave={(next, lmp) => {
            if (lmp) patchProfile({ lmpDate: lmp });
            setOverride(next);
            setEditing(false);
          }}
        />
      ) : null}
    </Card>
  );
}

function OverrideForm({
  initial,
  lmpDate,
  onSave,
  onCancel,
  onClear,
}: {
  initial?: GestationalOverride;
  lmpDate?: string;
  onSave: (override: GestationalOverride, lmpDate?: string) => void;
  onCancel: () => void;
  onClear: () => void;
}) {
  const [measuredOn, setMeasuredOn] = useState(
    initial?.measuredOn ?? new Date().toISOString().slice(0, 10),
  );
  const [weeks, setWeeks] = useState(String(initial?.weeks ?? 12));
  const [days, setDays] = useState(String(initial?.days ?? 0));
  const [source, setSource] = useState<GestationalOverride['source']>(
    initial?.source ?? 'ultrasound',
  );
  const [lmp, setLmp] = useState(lmpDate ?? '');

  const parsedWeeks = Number(toEnDigits(weeks));
  const parsedDays = Number(toEnDigits(days));
  const valid =
    Number.isFinite(parsedWeeks) &&
    parsedWeeks >= 0 &&
    parsedWeeks <= 43 &&
    Number.isFinite(parsedDays) &&
    parsedDays >= 0 &&
    parsedDays <= 6;

  const preview = valid
    ? dueDateFromOverride({ measuredOn, weeks: parsedWeeks, days: parsedDays, source })
    : null;

  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t border-surface-border pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        onSave(
          { measuredOn, weeks: parsedWeeks, days: parsedDays, source },
          lmp || undefined,
        );
      }}
    >
      <Field label="تاریخ اندازه‌گیری (میلادی)">
        <input
          type="date"
          value={measuredOn}
          onChange={(event) => setMeasuredOn(event.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="هفته">
          <input
            inputMode="numeric"
            value={weeks}
            onChange={(event) => setWeeks(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="روز (۰ تا ۶)">
          <input
            inputMode="numeric"
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="منبع اندازه‌گیری">
        <select
          value={source}
          onChange={(event) =>
            setSource(event.target.value as GestationalOverride['source'])
          }
          className={inputClass}
        >
          {Object.entries(OVERRIDE_SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="اولین روز آخرین قاعدگی (اختیاری)">
        <input
          type="date"
          value={lmp}
          onChange={(event) => setLmp(event.target.value)}
          className={inputClass}
        />
      </Field>

      {preview ? (
        <p className="rounded-xl bg-mint-soft p-2.5 text-xs leading-6 text-ink">
          تاریخ زایمان اصلاح‌شده: <strong>{jalaliLong(preview)}</strong>
        </p>
      ) : (
        <p className="text-xs text-coral">مقدار هفته یا روز معتبر نیست.</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!valid}
          className="afrat-tap flex-1 rounded-pill bg-primary-deep px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          ذخیره
        </button>
        {initial ? (
          <button
            type="button"
            onClick={onClear}
            className="afrat-tap rounded-pill border border-surface-border px-4 py-2.5 text-sm font-medium text-ink-muted"
          >
            حذف اصلاح
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCancel}
          className="afrat-tap rounded-pill px-4 py-2.5 text-sm font-medium text-ink-muted"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
