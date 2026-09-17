'use client';

import { MessageCircleHeart } from 'lucide-react';

import { Card } from '@/components/ui';
import { babyAge } from '@/modules/tracker/lib/cycle';
import { resolveGestation } from '@/modules/tracker/lib/gestation';
import { weeklyEntryFor } from '@/modules/tracker/data/weeklyContent';
import type { UserProfile } from '@/types';

/** Rotating postpartum lines, indexed by the day of the month. */
const BABY_VOICE_LINES = [
  'وقتی صدایت را می‌شنوم، آرام می‌شوم.',
  'دست‌های کوچکم هر روز قوی‌تر می‌شوند.',
  'بغل تو امن‌ترین جای دنیاست.',
  'امروز یاد گرفتم به صدای جدید گوش بدهم.',
  'خواب من کوتاه است، اما رشدم بلند.',
  'لبخندت را تقلید می‌کنم — تمرین می‌خواهد!',
  'شیر تو هم غذاست، هم دارو.',
];

/**
 * «پیام روز» — a one-line note in the fetus's or baby's voice. Warm on
 * purpose, but never clinical: guidance lives in the tracker and consult tabs.
 */
export function DailyMessage({ profile }: { profile: UserProfile }) {
  const message = (() => {
    if (profile.mode === 'pregnancy') {
      const gestation = resolveGestation(profile);
      if (gestation) return weeklyEntryFor(gestation.weeks).babyVoice;
    }
    if (profile.mode === 'postpartum' && profile.baby) {
      const { totalDays } = babyAge(profile.baby.birthDate);
      return BABY_VOICE_LINES[totalDays % BABY_VOICE_LINES.length];
    }
    return 'هر روز که بدنت را بشناسی، یک قدم به هدفت نزدیک‌تر می‌شوی.';
  })();

  const from =
    profile.mode === 'postpartum' && profile.baby
      ? `${profile.baby.name} می‌گوید`
      : profile.mode === 'pregnancy'
        ? 'کوچولوی تو می‌گوید'
        : 'پیام امروز';

  return (
    <Card className="border-primary/25 bg-primary/8">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-deep text-white">
          <MessageCircleHeart className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary-deep">{from}</p>
          <p className="mt-1 text-sm leading-7 text-ink">«{message}»</p>
        </div>
      </div>
    </Card>
  );
}
