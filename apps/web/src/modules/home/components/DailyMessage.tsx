'use client';

import { MessageCircleHeart } from 'lucide-react';

import { Card, IconBadge } from '@/components/ui';
import { babyAge, resolveCycle, type CyclePhase } from '@/modules/tracker/lib/cycle';
import { resolveGestation } from '@/modules/tracker/lib/gestation';
import { weeklyEntryFor } from '@/modules/tracker/data/weeklyContent';
import type { UserProfile } from '@/types';

/** Phase-based self-care tips for the general cycle mode (Mode A). */
const PHASE_TIPS: Record<CyclePhase, string> = {
  menstrual: 'استراحت را در اولویت بگذارید و آب گرم و منیزیم به کاهش دردها کمک می‌کند.',
  follicular: 'انرژی این روزها معمولاً بالاتر است — زمان خوبی برای شروع یک عادت جدید یا ورزش سبک.',
  ovulation: 'ممکن است انرژی و اعتمادبه‌نفس در اوج باشد؛ نوشیدن آب کافی را فراموش نکنید.',
  luteal: 'نوسانات خلقی (PMS) در این فاز شایع است — کاهش کافئین و خواب منظم کمک‌کننده است.',
};

/** Preconception tips for couples trying to conceive (Mode B). */
const PRECONCEPTION_TIPS = [
  'مصرف روزانهٔ اسید فولیک را حداقل یک ماه پیش از بارداری شروع کنید.',
  'هر دو نفر از زوجین سیگار و الکل را کنار بگذارید — کیفیت اسپرم هم به آن حساس است.',
  'وزن متعادل و ورزش منظم شانس باروری را در هر دو طرف افزایش می‌دهد.',
  'کافئین را به کمتر از ۲۰۰ میلی‌گرم در روز محدود کنید.',
  'چکاپ‌های پیش از بارداری (تیروئید، ویتامین D، دندان‌پزشکی) را از قبل انجام دهید.',
  'استرس بر تخمک‌گذاری اثر می‌گذارد؛ تکنیک‌های آرام‌سازی را با هم تمرین کنید.',
];

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
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );

  const message = (() => {
    if (profile.mode === 'pregnancy') {
      const gestation = resolveGestation(profile);
      if (gestation) return weeklyEntryFor(gestation.weeks).babyVoice;
    }
    if (profile.mode === 'postpartum' && profile.baby) {
      const { totalDays } = babyAge(profile.baby.birthDate);
      return BABY_VOICE_LINES[totalDays % BABY_VOICE_LINES.length];
    }
    if (profile.mode === 'ttc') {
      return PRECONCEPTION_TIPS[dayOfYear % PRECONCEPTION_TIPS.length];
    }
    const cycle = resolveCycle(profile);
    if (cycle) return PHASE_TIPS[cycle.phase];
    return 'هر روز که بدنت را بشناسی، یک قدم به هدفت نزدیک‌تر می‌شوی.';
  })();

  const from =
    profile.mode === 'postpartum' && profile.baby
      ? `${profile.baby.name} می‌گوید`
      : profile.mode === 'pregnancy'
        ? 'کوچولوی تو می‌گوید'
        : profile.mode === 'ttc'
          ? 'نکتهٔ امروز برای زوجین'
          : 'نکتهٔ امروز';

  return (
    <Card className="border-primary/25 bg-primary/8">
      <div className="flex gap-3">
        <IconBadge icon={MessageCircleHeart} tone="solid" shape="pill" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary-deep">{from}</p>
          <p className="mt-1 text-sm leading-7 text-ink">«{message}»</p>
        </div>
      </div>
    </Card>
  );
}
