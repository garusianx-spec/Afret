import Link from 'next/link';
import {
  Activity,
  Droplet,
  NotebookPen,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

interface Action {
  href: string;
  label: string;
  Icon: LucideIcon;
  tone: string;
}

const ACTIONS: Action[] = [
  { href: '/tracker#weight', label: 'ثبت وزن', Icon: Activity, tone: 'bg-primary/12 text-primary-deep' },
  { href: '/tracker#glucose', label: 'قند خون', Icon: Droplet, tone: 'bg-coral-soft text-ink' },
  { href: '/tracker#symptoms', label: 'ثبت علائم', Icon: NotebookPen, tone: 'bg-mint-soft text-mint' },
  { href: '/chat', label: 'پرسش از پزشک', Icon: Stethoscope, tone: 'bg-primary/12 text-primary-deep' },
];

export function QuickActions() {
  return (
    <nav aria-label="دسترسی سریع">
      <ul className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ href, label, Icon, tone }) => (
          <li key={href}>
            <Link
              href={href}
              className="afrat-card flex h-full flex-col items-center gap-1.5 px-1 py-3 text-center"
            >
              <span
                className={`flex size-9 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
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
