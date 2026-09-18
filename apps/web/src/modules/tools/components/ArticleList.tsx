'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { Article } from '../data/toolContent';

/** Expandable short-form article cards — the "مقالات" tool. */
export function ArticleList({ title, articles }: { title: string; articles: Article[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ul className="flex flex-col divide-y divide-surface-border">
        {articles.map((article) => {
          const open = openId === article.id;
          return (
            <li key={article.id} className="py-2 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : article.id)}
                aria-expanded={open}
                className="afrat-tap flex w-full items-center justify-between gap-2 py-1.5 text-start"
              >
                <span className="text-sm font-medium text-ink">{article.title}</span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-ink-faint transition-transform',
                    open && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
              {open ? (
                <p className="mt-1 text-xs leading-6 text-ink-muted">{article.body}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
