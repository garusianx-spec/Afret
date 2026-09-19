'use client';

import { Loader2, ShieldOff, X } from 'lucide-react';

import { jalaliShort } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';

import { usePatientVitals } from '../hooks/usePatientVitals';
import { RiskFlagBadge } from './RiskFlagBadge';

/**
 * The clinical-sync drawer. A patient who has not opted in shows a plain
 * "not shared" state — this endpoint never leaks a stale or partial
 * snapshot, so there is nothing more to fall back to.
 */
export function PatientVitalsDrawer({
  patientId,
  patientName,
  onClose,
}: {
  patientId: string;
  patientName: string;
  onClose: () => void;
}) {
  const { vitals, isLoading } = usePatientVitals(patientId, true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`گزارش سلامت ${patientName}`}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-card bg-surface-card p-5 shadow-raised sm:rounded-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">گزارش سلامت {patientName}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="afrat-tap flex size-8 items-center justify-center rounded-full text-ink-faint hover:bg-surface"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-ink-faint" aria-hidden="true" />
          </div>
        ) : !vitals?.sharingEnabled ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ShieldOff className="size-8 text-ink-faint" aria-hidden="true" />
            <p className="text-sm text-ink-muted">
              این بیمار گزارش سلامت را به اشتراک نگذاشته است.
            </p>
          </div>
        ) : (
          <>
            {vitals.overallTier !== 'normal' ? (
              <div className="mb-3 flex items-center gap-2">
                <RiskFlagBadge flag={vitals.overallTier} />
                <span className="text-xs text-ink-muted">
                  {vitals.alerts.length} مورد خارج از محدودهٔ هدف
                </span>
              </div>
            ) : null}

            <ul className="flex flex-col gap-1.5">
              {vitals.readings.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs"
                >
                  <span className="text-ink-muted">{jalaliShort(r.at)}</span>
                  <span className="font-medium text-ink tabular-nums">
                    {r.systolic != null
                      ? `${toFaDigits(r.systolic)}/${toFaDigits(r.diastolic ?? 0)} mmHg`
                      : r.glucose != null
                        ? `${toFaDigits(r.glucose)} mg/dL`
                        : `${toFaDigits(r.weightKg ?? 0)} kg`}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[10px] leading-5 text-ink-faint">
              آخرین به‌روزرسانی: {jalaliShort(vitals.updatedAt)} — این گزارش خودارزیابی بیمار
              است، نه اندازه‌گیری بالینی تأییدشده.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
