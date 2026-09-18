import Link from 'next/link';
import { Users, type LucideIcon } from 'lucide-react';

import { AppHeader } from '@/components/layout/AppHeader';
import { IconBadge } from '@/components/ui';

/**
 * Shown on tabs that only make sense for a mother tracking her own body —
 * a clinician doesn't have a cycle or a pregnancy of her own to log here.
 */
export function ClinicianNotice({
  title,
  icon = Users,
  message,
}: {
  title: string;
  icon?: LucideIcon;
  message: string;
}) {
  return (
    <>
      <AppHeader title={title} />
      <main className="afrat-page pt-3">
        <div className="afrat-card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <IconBadge icon={icon} tone="primary" size="lg" shape="pill" />
          <p className="text-sm leading-7 text-ink-muted">{message}</p>
          <Link
            href="/"
            className="afrat-tap mt-1 rounded-pill bg-primary-deep px-4 py-2 text-xs font-bold text-white"
          >
            بازگشت به لیست مراجعین
          </Link>
        </div>
      </main>
    </>
  );
}
