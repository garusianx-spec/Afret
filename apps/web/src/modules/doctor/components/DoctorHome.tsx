'use client';

import { AlertTriangle, Users } from 'lucide-react';

import { AppHeader } from '@/components/layout/AppHeader';
import { Chip } from '@/components/ui';
import { jalaliWithWeekday } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';

import { usePatients } from '../hooks/usePatients';
import { PatientCard } from './PatientCard';

/**
 * The clinical home screen — replaces the mother-facing dashboard entirely
 * for a `doctor` (and other consult-capable) role. A clinician has no cycle
 * to track and no fetal week of her own; showing her that shell empty would
 * be a worse experience than a dedicated one.
 */
export function DoctorHome({ displayName }: { displayName: string }) {
  const { patients, isLoading, updateFlag } = usePatients();
  const urgentCount = patients.filter((p) => p.riskFlag === 'urgent').length;
  const totalUnread = patients.reduce((sum, p) => sum + p.unreadCount, 0);

  return (
    <>
      <AppHeader
        title={`سلام، ${displayName}`}
        subtitle={jalaliWithWeekday(new Date())}
      />

      <main className="afrat-page flex flex-col gap-3 pt-3">
        <div className="afrat-card flex items-center gap-3 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-deep">
            <Users className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">لیست مراجعین</p>
            <p className="text-xs text-ink-muted">
              {toFaDigits(patients.length)} بیمار · {toFaDigits(totalUnread)} پیام خوانده‌نشده
            </p>
          </div>
          {urgentCount > 0 ? (
            <Chip tone="coral">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              {toFaDigits(urgentCount)} فوری
            </Chip>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-card bg-surface-card" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="afrat-card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span aria-hidden="true" className="text-3xl">
              👩‍⚕️
            </span>
            <p className="text-sm leading-7 text-ink-muted">
              هنوز مراجعه‌کننده‌ای در فهرست شما نیست. وقتی بیماری گفتگوی
              مشاوره با شما را شروع کند، اینجا نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onSetFlag={(flag) => void updateFlag(patient.id, flag)}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
