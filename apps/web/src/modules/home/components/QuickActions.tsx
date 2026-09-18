import Link from 'next/link';
import {
  Activity,
  Baby,
  Droplet,
  HeartPulse,
  ListChecks,
  Ruler,
  Stethoscope,
  Syringe,
  Thermometer,
  Waves,
  type LucideIcon,
} from 'lucide-react';

import { IconBadge } from '@/components/ui';
import type { LifecycleMode } from '@/types';

interface Action {
  href: string;
  label: string;
  Icon: LucideIcon;
  tone: 'primary' | 'coral' | 'mint';
}

/**
 * Four shortcuts, chosen per lifecycle mode. A pregnancy-only glucose
 * shortcut has no business on a cycle-tracking mother's home screen — the
 * same "show only what's relevant to this mode" discipline the tabs follow.
 */
const ACTIONS_BY_MODE: Record<LifecycleMode, Action[]> = {
  cycle: [
    { href: '/tracker#cycle', label: 'ثبت پریود', Icon: Activity, tone: 'primary' },
    { href: '/tracker#period-history', label: 'تاریخچهٔ چرخه', Icon: ListChecks, tone: 'mint' },
    { href: '/profile#tools', label: 'ابزارها', Icon: HeartPulse, tone: 'coral' },
    { href: '/chat', label: 'پرسش از پزشک', Icon: Stethoscope, tone: 'primary' },
  ],
  ttc: [
    { href: '/tracker#bbt', label: 'ثبت دمای پایه', Icon: Thermometer, tone: 'coral' },
    { href: '/tracker#mucus', label: 'ثبت ترشحات', Icon: Droplet, tone: 'primary' },
    { href: '/tracker#fertility', label: 'پنجرهٔ باروری', Icon: Waves, tone: 'mint' },
    { href: '/chat', label: 'پرسش از پزشک', Icon: Stethoscope, tone: 'primary' },
  ],
  pregnancy: [
    { href: '/tracker#weight', label: 'ثبت وزن', Icon: Activity, tone: 'primary' },
    { href: '/tracker#glucose', label: 'قند خون', Icon: Droplet, tone: 'coral' },
    { href: '/tracker#kicks', label: 'شمارش حرکات', Icon: Baby, tone: 'mint' },
    { href: '/chat', label: 'پرسش از پزشک', Icon: Stethoscope, tone: 'primary' },
  ],
  postpartum: [
    { href: '/tracker#vaccines', label: 'واکسیناسیون', Icon: Syringe, tone: 'coral' },
    { href: '/tracker#growth', label: 'نمودار رشد', Icon: Ruler, tone: 'mint' },
    { href: '/profile#memories', label: 'آلبوم خاطرات', Icon: HeartPulse, tone: 'primary' },
    { href: '/chat', label: 'پرسش از پزشک', Icon: Stethoscope, tone: 'primary' },
  ],
};

export function QuickActions({ mode }: { mode: LifecycleMode }) {
  const actions = ACTIONS_BY_MODE[mode];

  return (
    <nav aria-label="دسترسی سریع">
      <ul className="grid grid-cols-4 gap-2">
        {actions.map(({ href, label, Icon, tone }) => (
          <li key={href}>
            <Link
              href={href}
              className="afrat-card flex h-full flex-col items-center gap-1.5 px-1 py-3 text-center"
            >
              <IconBadge icon={Icon} tone={tone} size="sm" />
              <span className="text-[11px] font-medium leading-4 text-ink">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
