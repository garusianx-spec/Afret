'use client';

import { useEffect, useRef, useState } from 'react';
import { Moon, Pause, Play, Timer } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import { SOUND_LIBRARY, type SoundTrack } from '../data/checklists';

const SLEEP_TIMERS = [0, 15, 30, 60] as const;

/**
 * Looping white-noise / lullaby player.
 *
 * Uses the Media Session API so playback keeps going with the screen off and
 * shows proper controls on the Android lock screen — the whole point of this
 * feature is that the phone is face-down next to a sleeping baby.
 */
export function SoundPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<SoundTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // `audio` is created lazily so SSR never touches the DOM API.
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'none';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: 'آفرت',
      album: current.category,
      artwork: [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', () => void toggle(current));
    navigator.mediaSession.setActionHandler('pause', () => stop());

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  };

  const armSleepTimer = (minutes: number) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setTimerMinutes(minutes);
    if (minutes === 0) return;
    sleepTimerRef.current = setTimeout(() => {
      stop();
      setTimerMinutes(0);
    }, minutes * 60_000);
  };

  const toggle = async (track: SoundTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (current?.id === track.id && playing) {
      stop();
      return;
    }

    if (current?.id !== track.id) {
      audio.src = track.src;
      setCurrent(track);
    }

    try {
      await audio.play();
      setPlaying(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      if (timerMinutes > 0) armSleepTimer(timerMinutes);
    } catch {
      // Autoplay policy or a missing audio file — leave the UI in a paused
      // state rather than throwing an unhandled rejection.
      setPlaying(false);
    }
  };

  return (
    <Card>
      <CardTitle
        action={
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <Timer className="size-3.5" aria-hidden="true" />
            {timerMinutes > 0 ? `${toFaDigits(timerMinutes)} دقیقه` : 'بدون تایمر'}
          </span>
        }
      >
        صداهای آرام‌بخش
      </CardTitle>

      <div
        role="group"
        aria-label="تایمر خواب"
        className="mb-3 flex gap-1.5"
      >
        {SLEEP_TIMERS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            aria-pressed={timerMinutes === minutes}
            onClick={() => armSleepTimer(minutes)}
            className={cn(
              'afrat-tap flex-1 rounded-pill px-2 py-1.5 text-[11px] font-medium transition',
              timerMinutes === minutes
                ? 'bg-primary-deep text-white'
                : 'bg-surface text-ink-muted',
            )}
          >
            {minutes === 0 ? 'خاموش' : `${toFaDigits(minutes)} دقیقه`}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-1.5">
        {SOUND_LIBRARY.map((track) => {
          const active = current?.id === track.id && playing;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => void toggle(track)}
                className={cn(
                  'afrat-tap flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-start transition',
                  active ? 'bg-primary/12' : 'hover:bg-surface',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    active ? 'bg-primary-deep text-white' : 'bg-surface text-primary-deep',
                  )}
                >
                  {active ? (
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
                {active ? (
                  <Moon className="size-4 shrink-0 text-primary-deep" aria-hidden="true" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
