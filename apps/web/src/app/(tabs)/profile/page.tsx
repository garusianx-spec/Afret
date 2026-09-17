'use client';

import { HeartHandshake } from 'lucide-react';

import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardTitle, SectionTitle } from '@/components/ui';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';
import { MemoryAlbum } from '@/modules/profile/components/MemoryAlbum';
import { NotificationSettings } from '@/modules/profile/components/NotificationSettings';
import { SoundPlayer } from '@/modules/profile/components/SoundPlayer';
import { ToolkitChecklist } from '@/modules/profile/components/ToolkitChecklist';
import { HOSPITAL_BAG, LAYETTE } from '@/modules/profile/data/checklists';
import { useUserStore } from '@/stores/userStore';
import { LIFECYCLE_LABELS, type LifecycleMode } from '@/types';

const MODES: LifecycleMode[] = ['cycle', 'ttc', 'pregnancy', 'postpartum'];

export default function ProfilePage() {
  const hydrated = useHydrated();
  const profile = useUserStore((s) => s.profile);
  const setMode = useUserStore((s) => s.setMode);

  if (!hydrated || !profile) {
    return (
      <main className="afrat-page pt-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-card bg-surface-card" />
      </main>
    );
  }

  return (
    <>
      <AppHeader title="حساب و ابزارها" subtitle={profile.displayName} />

      <main className="afrat-page flex flex-col gap-3 pt-3">
        <Card>
          <CardTitle>وضعیت فعلی من</CardTitle>
          <div role="radiogroup" aria-label="انتخاب وضعیت" className="grid grid-cols-2 gap-2">
            {MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={profile.mode === mode}
                onClick={() => setMode(mode)}
                className={cn(
                  'afrat-tap rounded-xl px-3 py-3 text-xs font-medium transition',
                  profile.mode === mode
                    ? 'bg-primary-deep text-white'
                    : 'bg-surface text-ink-muted',
                )}
              >
                {LIFECYCLE_LABELS[mode]}
              </button>
            ))}
          </div>
        </Card>

        <NotificationSettings />

        <SectionTitle>خاطرات و آرامش</SectionTitle>
        <MemoryAlbum />
        <SoundPlayer />

        <SectionTitle>برنامه‌ریزی</SectionTitle>
        <ToolkitChecklist listId="hospital-bag" title="چک‌لیست ساک زایمان" items={HOSPITAL_BAG} />
        <ToolkitChecklist listId="layette" title="برنامه‌ریز سیسمونی" items={LAYETTE} />

        <SectionTitle>راهنما</SectionTitle>
        <Card>
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-coral-soft text-ink">
              <HeartHandshake className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">
                رابطهٔ زناشویی در بارداری
              </h2>
              <p className="mt-1 text-xs leading-6 text-ink-muted">
                در بارداری کم‌خطر، نزدیکی معمولاً بی‌خطر است. در موارد خونریزی،
                پارگی کیسهٔ آب، جفت سرراهی یا سابقهٔ زایمان زودرس حتماً پیش از
                هر تصمیمی با پزشک خود مشورت کنید.
              </p>
              <p className="mt-2 text-[11px] text-ink-faint">
                این متن آموزشی است و جایگزین نظر پزشک شما نیست.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
