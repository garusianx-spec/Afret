'use client';

import { AlertCircle, Loader2, Moon, Pause, Play, Timer } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import { SOUND_LIBRARY } from '../data/checklists';
import { useBackgroundAudio } from '../hooks/useBackgroundAudio';

const SLEEP_TIMERS = [0, 15, 30, 60] as const;

/** `۰۹:۳۴` — remaining time on the sleep timer. */
function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return toFaDigits(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}

export function SoundPlayer() {
  const {
    current,
    playing,
    loading,
    error,
    sleepMinutes,
    sleepRemaining,
    toggle,
    setSleepTimer,
  } = useBackgroundAudio();

  return (
    <Card>
      <CardTitle
        action={
          <span className="flex items-center gap-1 text-xs text-ink-muted tabular-nums">
            <Timer className="size-3.5" aria-hidden="true" />
            {sleepRemaining > 0
              ? formatRemaining(sleepRemaining)
              : sleepMinutes > 0
                ? `${toFaDigits(sleepMinutes)} دقیقه`
                : 'بدون تایمر'}
          </span>
        }
      >
        صداهای آرام‌بخش
      </CardTitle>

      <div role="group" aria-label="تایمر خواب" className="mb-3 flex gap-1.5">
        {SLEEP_TIMERS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            aria-pressed={sleepMinutes === minutes}
            onClick={() => setSleepTimer(minutes)}
            className={cn(
              'afrat-tap flex-1 rounded-pill px-2 py-1.5 text-[11px] font-medium transition',
              sleepMinutes === minutes
                ? 'bg-primary-deep text-white'
                : 'bg-surface text-ink-muted',
            )}
          >
            {minutes === 0 ? 'خاموش' : `${toFaDigits(minutes)} دقیقه`}
          </button>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-3 flex items-start gap-1.5 rounded-xl bg-coral-soft p-2.5 text-[11px] leading-5 text-ink"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-1.5">
        {SOUND_LIBRARY.map((track) => {
          const isCurrent = current?.id === track.id;
          const isPlaying = isCurrent && playing;
          const isLoading = isCurrent && loading && !playing;

          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => toggle(track)}
                aria-pressed={isPlaying}
                className={cn(
                  'afrat-tap flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-start transition',
                  isCurrent ? 'bg-primary/12' : 'hover:bg-surface',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    isPlaying
                      ? 'bg-primary-deep text-white'
                      : 'bg-surface text-primary-deep',
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : isPlaying ? (
                    <Pause className="size-4" aria-hidden="true" />
                  ) : (
                    <Play className="size-4" aria-hidden="true" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink">{track.title}</span>
                  <span className="block text-[11px] text-ink-faint">
                    {track.category}
                  </span>
                </span>

                {isPlaying ? (
                  <Moon
                    className="size-4 shrink-0 text-primary-deep"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] leading-5 text-ink-faint">
        پخش با قفل بودن صفحه ادامه پیدا می‌کند و از کنترل‌های صفحهٔ قفل گوشی
        قابل مدیریت است.
      </p>
    </Card>
  );
}
