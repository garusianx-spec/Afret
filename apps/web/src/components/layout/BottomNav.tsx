'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarHeart,
  House,
  MessagesSquare,
  Salad,
  UserRound,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Five persistent tabs. Source order is visual right-to-left under `dir="rtl"`,
 * so «خانه» sits on the right — where a Persian reader's thumb starts.
 */
const TABS = [
  { href: '/', label: 'خانه', Icon: House },
  { href: '/tracker', label: 'تقویم', Icon: CalendarHeart },
  { href: '/nutrition', label: 'تغذیه', Icon: Salad },
  { href: '/chat', label: 'گفتگو', Icon: MessagesSquare },
  { href: '/profile', label: 'حساب', Icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-surface-card/95 shadow-nav backdrop-blur afrat-safe-bottom"
    >
      <ul className="mx-auto flex w-full max-w-lg items-stretch justify-between px-2">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-navbar flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition',
                  active ? 'text-primary-deep' : 'text-ink-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-pill transition',
                    active && 'bg-primary/15',
                  )}
                >
                  <Icon
                    className={cn('size-5', active && 'stroke-[2.4]')}
                    aria-hidden="true"
                  />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
