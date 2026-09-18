import type { LucideIcon } from 'lucide-react';

import { Card, IconBadge } from '@/components/ui';

interface InfoGuideCardProps {
  icon: LucideIcon;
  tone?: 'primary' | 'mint' | 'coral';
  title: string;
  body: string;
  /** Shown as the closing disclaimer — every guide gets one. */
  disclaimer?: string;
}

/**
 * Static, non-diagnostic informational content — the "guide" pattern used
 * across the tools tab (self-care, fertility diet, cord blood, etc.). One
 * shape for all of it, so a mother learns to recognise "this is education,
 * not a form" at a glance.
 */
export function InfoGuideCard({
  icon,
  tone = 'primary',
  title,
  body,
  disclaimer = 'این متن آموزشی است و جایگزین نظر پزشک شما نیست.',
}: InfoGuideCardProps) {
  return (
    <Card>
      <div className="flex gap-3">
        <IconBadge icon={icon} tone={tone} shape="pill" />
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <p className="mt-1 text-xs leading-6 text-ink-muted">{body}</p>
          {disclaimer ? (
            <p className="mt-2 text-[11px] text-ink-faint">{disclaimer}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
