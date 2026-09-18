'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardTitle, SectionTitle } from '@/components/ui';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';
import { AccountCard } from '@/modules/auth/components';
import { useAuth } from '@/modules/auth';
import { NotificationSettings } from '@/modules/profile/components/NotificationSettings';
import { ToolsSection } from '@/modules/tools/components/ToolsSection';
import { useUserStore } from '@/stores/userStore';
import { LIFECYCLE_LABELS, type LifecycleMode } from '@/types';

const MODES: LifecycleMode[] = ['cycle', 'ttc', 'pregnancy', 'postpartum'];

export default function ProfilePage() {
  const hydrated = useHydrated();
  const profile = useUserStore((s) => s.profile);
  const setMode = useUserStore((s) => s.setMode);
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  if (!isDoctor && (!hydrated || !profile)) {
    return (
      <main className="afrat-page pt-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-card bg-surface-card" />
      </main>
    );
  }

  return (
    <>
      <AppHeader
        title="حساب"
        subtitle={isDoctor ? user?.fullName : profile?.displayName}
      />

      <main className="afrat-page flex flex-col gap-3 pt-3">
        <AccountCard />
        <NotificationSettings />

        {/*
          A clinician has no lifecycle stage of her own and none of these
          tools apply to her — the mode switcher and the mode-filtered tools
          section below are strictly for the mother-facing account.
        */}
        {!isDoctor && profile ? (
          <>
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

            {/*
              Everything below is filtered strictly by the mode selected
              above — a hospital-bag checklist or a fertility diet guide is a
              genuine mismatch outside the mode it belongs to, not a harmless
              extra. See `ToolsSection` for the per-mode content.
            */}
            <SectionTitle hint={LIFECYCLE_LABELS[profile.mode]} id="tools">
              ابزارها و مراقبت
            </SectionTitle>
            <ToolsSection mode={profile.mode} />
          </>
        ) : null}
      </main>
    </>
  );
}
