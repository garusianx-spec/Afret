import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type CardProps = ComponentPropsWithoutRef<'section'> & {
  /** Rendered element — `article` for self-contained content, `div` inside lists. */
  as?: 'section' | 'article' | 'div';
};

export function Card({ children, className, as: Tag = 'section', ...rest }: CardProps) {
  return (
    <Tag className={cn('afrat-card p-4', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-2', className)}>
      <h2 className="min-w-0 text-sm font-bold text-ink">{children}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
