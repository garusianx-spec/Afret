'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';

import { Card, CardTitle, IconBadge } from '@/components/ui';
import { pushVitals, setVitalsSharing } from '@/modules/doctor/api/doctorApi';

import { toClinicalReadings } from '../lib/clinicalSync';
import { useHealthLogStore } from '../store/healthLogStore';
import { useVitalsSyncStore } from '../store/vitalsSyncStore';

/**
 * "اشتراک‌گذاری گزارش سلامت با پزشک" — opt-in, off by default, and
 * reversible: turning it off deletes the server-side snapshot (see
 * PATCH /api/profile/vitals-sharing), it does not just stop refreshing it.
 *
 * Only the three fields named on the card ever leave the device. Everything
 * else the tracker logs (mood, nausea, symptoms, BBT, cervical mucus) never
 * syncs, on or off.
 */
export function ShareVitalsToggle() {
  const enabled = useVitalsSyncStore((s) => s.enabled);
  const setEnabled = useVitalsSyncStore((s) => s.setEnabled);
  // Selecting the raw array keeps this re-render only on an actual log
  // change; deriving a filtered array inline would return a new reference
  // (and re-render) on every unrelated store update.
  const logs = useHealthLogStore((s) => s.logs);
  const readings = useMemo(() => toClinicalReadings(logs), [logs]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  // Keeps the server snapshot current while sharing is on — debounced so a
  // burst of edits doesn't fire a request per keystroke.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      pushVitals(readings).catch(() => setError(true));
    }, 800);
    return () => clearTimeout(timer);
  }, [enabled, readings]);

  const toggle = async () => {
    const next = !enabled;
    setPending(true);
    setError(false);
    try {
      await setVitalsSharing(next);
      setEnabled(next);
      if (next) await pushVitals(readings);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardTitle>اشتراک‌گذاری گزارش سلامت با پزشک</CardTitle>
      <div className="flex items-center gap-3">
        <IconBadge icon={enabled ? ShieldCheck : ShieldOff} tone={enabled ? 'mint' : 'neutral'} shape="pill" />
        <p className="flex-1 text-xs leading-6 text-ink-muted">
          {enabled
            ? 'فشار خون، قند خون و وزن اخیر شما برای پزشک قابل مشاهده است.'
            : 'فشار خون، قند خون و وزن شما فقط روی همین دستگاه ذخیره می‌شود.'}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => void toggle()}
          className="afrat-tap shrink-0 rounded-pill bg-primary-deep px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {enabled ? 'غیرفعال کردن' : 'فعال کردن'}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-[11px] text-coral">
          به‌روزرسانی ناموفق بود — اتصال اینترنت را بررسی کنید.
        </p>
      ) : null}
    </Card>
  );
}
