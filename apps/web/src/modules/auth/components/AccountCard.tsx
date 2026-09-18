'use client';

import { useState } from 'react';
import { LogOut, ShieldCheck, ShieldAlert, UserRound } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { cn } from '@/lib/utils';

import { useAuth } from '../AuthProvider';
import { formatMobileForDisplay } from '../lib/mobile';

export function AccountCard() {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  return (
    <Card>
      <CardTitle
        action={
          <Chip tone={user.mobileVerified ? 'mint' : 'coral'}>
            {user.mobileVerified ? (
              <ShieldCheck className="size-3.5" aria-hidden="true" />
            ) : (
              <ShieldAlert className="size-3.5" aria-hidden="true" />
            )}
            {user.mobileVerified ? 'تأییدشده' : 'تأیید نشده'}
          </Chip>
        }
      >
        حساب کاربری
      </CardTitle>

      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary-deep">
          <UserRound className="size-6" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">
            {user.fullName ?? 'کاربر آفرت'}
          </p>
          {/* The number reads LTR even inside the RTL card. */}
          <p className="text-xs text-ink-muted" dir="ltr" style={{ textAlign: 'right' }}>
            {formatMobileForDisplay(user.mobile)}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-faint">{user.roleLabel}</p>
        </div>
      </div>

      {!user.mobileVerified ? (
        <p className="mt-3 rounded-xl bg-coral-soft p-2.5 text-[11px] leading-5 text-ink">
          تأیید شماره از طریق پیامک هنوز فعال نشده است. حساب شما کار می‌کند،
          اما پس از فعال شدن، تأیید شماره لازم خواهد بود.
        </p>
      ) : null}

      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          try {
            await logout();
          } finally {
            setSigningOut(false);
          }
        }}
        className={cn(
          'afrat-tap mt-4 flex w-full items-center justify-center gap-2 rounded-pill',
          'border border-surface-border py-2.5 text-xs font-bold text-ink-muted',
          'hover:bg-surface disabled:opacity-60',
        )}
      >
        {/* RTL: the exit arrow must point to the inline-end, i.e. left. */}
        <LogOut className="size-4 -scale-x-100" aria-hidden="true" />
        {signingOut ? 'در حال خروج…' : 'خروج از حساب'}
      </button>
    </Card>
  );
}
