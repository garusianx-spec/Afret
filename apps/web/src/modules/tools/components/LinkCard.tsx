import Link from 'next/link';
import { ChevronLeft, type LucideIcon } from 'lucide-react';

import { IconBadge } from '@/components/ui';

/** A tool that already lives on another tab — points there instead of duplicating state. */
export function LinkCard({
  href,
  icon,
  tone = 'primary',
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  tone?: 'primary' | 'mint' | 'coral';
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="afrat-card flex items-center gap-3 p-4">
      <IconBadge icon={icon} tone={tone} shape="pill" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-ink-muted">{subtitle}</p>
      </div>
      {/* RTL: "go" points to the inline-end, i.e. the left chevron. */}
      <ChevronLeft className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
    </Link>
  );
}
