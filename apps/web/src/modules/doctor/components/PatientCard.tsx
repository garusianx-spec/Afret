'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquareText, UserRound } from 'lucide-react';

import { IconBadge } from '@/components/ui';
import { formatFaRelative, toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import { JOURNEY_LABELS, RISK_FLAG_LABELS, type DoctorPatient, type RiskFlag } from '../types';
import { PrescriptionModal } from './PrescriptionModal';
import { RiskFlagBadge } from './RiskFlagBadge';

const FLAG_OPTIONS: RiskFlag[] = ['normal', 'watch', 'urgent'];

export function PatientCard({
  patient,
  onSetFlag,
}: {
  patient: DoctorPatient;
  onSetFlag: (flag: RiskFlag) => void;
}) {
  const [showFlags, setShowFlags] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);

  return (
    <li
      className={cn(
        'afrat-card flex flex-col gap-2.5 p-3.5',
        patient.riskFlag === 'urgent' && 'border-coral/40',
      )}
    >
      <div className="flex items-start gap-3">
        <IconBadge icon={UserRound} tone="primary" shape="pill" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-ink">{patient.displayName}</p>
            {patient.unreadCount > 0 ? (
              <span className="flex min-w-5 shrink-0 items-center justify-center rounded-pill bg-primary-deep px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                {toFaDigits(patient.unreadCount)}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            {patient.journeyMode ? JOURNEY_LABELS[patient.journeyMode] : 'وضعیت گزارش‌نشده'}
            {patient.journeyWeek != null ? ` · هفته/ماه ${toFaDigits(patient.journeyWeek)}` : ''}
          </p>
          {patient.lastMessage ? (
            <p className="mt-1 truncate text-xs text-ink-faint">
              {patient.lastMessage.body} · {formatFaRelative(patient.lastMessage.createdAt)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowFlags((v) => !v)}
          aria-expanded={showFlags}
        >
          <RiskFlagBadge flag={patient.riskFlag} />
        </button>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setShowPrescription(true)}
            className="afrat-tap rounded-pill bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary-deep"
          >
            تجویز و برنامهٔ غذایی
          </button>
          <Link
            href={`/chat/${patient.roomId}`}
            className="afrat-tap flex items-center gap-1 rounded-pill bg-primary-deep px-3 py-1.5 text-xs font-bold text-white"
          >
            <MessageSquareText className="size-3.5" aria-hidden="true" />
            گفتگو
          </Link>
        </div>
      </div>

      {showFlags ? (
        <div className="flex gap-1.5 border-t border-surface-border pt-2.5">
          {FLAG_OPTIONS.map((flag) => (
            <button
              key={flag}
              type="button"
              onClick={() => {
                onSetFlag(flag);
                setShowFlags(false);
              }}
              className={cn(
                'afrat-tap flex-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition',
                flag === patient.riskFlag ? 'bg-primary-deep text-white' : 'bg-surface text-ink-muted',
              )}
            >
              {RISK_FLAG_LABELS[flag]}
            </button>
          ))}
        </div>
      ) : null}

      {showPrescription ? (
        <PrescriptionModal
          patientName={patient.displayName}
          roomId={patient.roomId}
          onClose={() => setShowPrescription(false)}
        />
      ) : null}
    </li>
  );
}
