'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveTrackSrc, type SoundTrack } from '../data/checklists';

/**
 * Looping audio for the white-noise / lullaby player.
 *
 * Written against the constraints mobile browsers actually impose, not the
 * ones the HTMLAudioElement API implies:
 *
 *  - **Autoplay policy.** The first `play()` must happen inside a user
 *    gesture. The element is created once up front and reused, because a
 *    freshly constructed `Audio` outside a gesture is blocked on iOS even
 *    when the call chain started from a tap.
 *  - **`await` breaks the gesture on iOS.** Safari ties the permission to the
 *    synchronous portion of the handler, so `play()` is called *before* any
 *    awaited work, and the returned promise is handled afterwards.
 *  - **Looping.** `loop = true` gapless-loops in every current engine; a
 *    manual `ended` → `play()` restart audibly stutters.
 *  - **Interruptions.** A phone call, another app, or the user's own lock
 *    screen controls pause the element without telling React — so the `pause`
 *    and `play` events drive state rather than the toggle function alone.
 *  - **Lock screen.** Media Session metadata is what makes the controls show
 *    the track name instead of the page title, which is the whole point when
 *    the phone is face-down next to a sleeping baby.
 */

export interface BackgroundAudioState {
  current: SoundTrack | null;
  playing: boolean;
  /** Set when a file is missing or the browser refused to play. */
  error: string | null;
  loading: boolean;
  sleepMinutes: number;
  /** Seconds left on the sleep timer, or 0 when disarmed. */
  sleepRemaining: number;
}

export interface BackgroundAudioControls extends BackgroundAudioState {
  toggle: (track: SoundTrack) => void;
  stop: () => void;
  setSleepTimer: (minutes: number) => void;
}

/** Distinguishes the four MediaError codes instead of one generic message. */
function describeMediaError(audio: HTMLAudioElement): string {
  switch (audio.error?.code) {
    case MediaError.MEDIA_ERR_NETWORK:
      return 'اتصال اینترنت قطع شد. دوباره تلاش کنید.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'فایل صوتی خراب یا ناسازگار با این مرورگر است.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'این صدا در دسترس نیست یا قالب آن پشتیبانی نمی‌شود.';
    default:
      return 'پخش این صدا ممکن نشد.';
  }
}

export function useBackgroundAudio(): BackgroundAudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [current, setCurrent] = useState<SoundTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState(0);

  /** Create the element once, on the client, before any gesture arrives. */
  const getAudio = useCallback((): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null;
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
      // Keeps iOS from treating it as a video and trying to go fullscreen.
      audio.setAttribute('playsinline', '');
      // Harmless for same-origin local files, and required for a future
      // remote CDN track to expose timing/buffering info to this element
      // instead of failing silently on a cross-origin response.
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  /* Event-driven state: the element is the source of truth, because the OS
     can pause it without going through our toggle. */
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const onPlaying = () => {
      setPlaying(true);
      setLoading(false);
      setError(null);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };
    const onPause = () => {
      setPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };
    const onWaiting = () => setLoading(true);
    const onError = () => {
      setPlaying(false);
      setLoading(false);
      setError(describeMediaError(audio));
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);
    audio.addEventListener('stalled', onWaiting);

    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('stalled', onWaiting);
    };
  }, [getAudio]);

  const clearSleep = useCallback(() => {
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    sleepTimeoutRef.current = null;
    tickRef.current = null;
    setSleepRemaining(0);
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    clearSleep();
    setSleepMinutes(0);
  }, [clearSleep]);

  const armSleep = useCallback(
    (minutes: number) => {
      clearSleep();
      setSleepMinutes(minutes);
      if (minutes <= 0) return;

      setSleepRemaining(minutes * 60);
      sleepTimeoutRef.current = setTimeout(() => {
        audioRef.current?.pause();
        setPlaying(false);
        clearSleep();
        setSleepMinutes(0);
      }, minutes * 60_000);

      tickRef.current = setInterval(() => {
        setSleepRemaining((s) => (s <= 1 ? 0 : s - 1));
      }, 1000);
    },
    [clearSleep],
  );

  const setSleepTimer = useCallback(
    (minutes: number) => {
      // Only start counting down while something is actually playing;
      // otherwise the timer expires against silence.
      if (minutes > 0 && playing) armSleep(minutes);
      else {
        clearSleep();
        setSleepMinutes(minutes);
      }
    },
    [armSleep, clearSleep, playing],
  );

  const toggle = useCallback(
    (track: SoundTrack) => {
      const audio = getAudio();
      if (!audio) return;

      if (current?.id === track.id && !audio.paused) {
        audio.pause();
        return;
      }

      if (current?.id !== track.id) {
        audio.src = resolveTrackSrc(track.src);
        setCurrent(track);
        setError(null);
      }

      setLoading(true);

      // Called synchronously so Safari still counts this as user-initiated.
      const started = audio.play();

      if (started && typeof started.catch === 'function') {
        started.catch((err: unknown) => {
          // Switching tracks fast interrupts the previous play() with an
          // AbortError — that is not a policy block, it is expected, and the
          // `playing` event from the *new* track will supersede this state a
          // moment later. Only a real autoplay refusal should surface an error.
          const name = err instanceof DOMException ? err.name : '';
          if (name === 'AbortError') return;

          setPlaying(false);
          setLoading(false);
          setError('پخش خودکار توسط مرورگر مسدود شد. دوباره تلاش کنید.');
        });
      }

      if (sleepMinutes > 0) armSleep(sleepMinutes);
    },
    [current, getAudio, sleepMinutes, armSleep],
  );

  /* Lock-screen metadata and controls. */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: 'آفرت',
      album: current.category,
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => toggle(current));
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('stop', stop);
    // A looping soundscape has no meaningful seek or track order.
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    };
  }, [current, toggle, stop]);

  /* Release the element and any timers on unmount. */
  useEffect(
    () => () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    },
    [],
  );

  return {
    current,
    playing,
    loading,
    error,
    sleepMinutes,
    sleepRemaining,
    toggle,
    stop,
    setSleepTimer,
  };
}
