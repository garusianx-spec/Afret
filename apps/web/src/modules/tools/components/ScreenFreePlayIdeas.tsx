'use client';

import { Check, Sparkle } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { cn } from '@/lib/utils';

import { SCREEN_FREE_PLAY_IDEAS } from '../data/toolContent';
import { usePlayIdeaStore } from '../store/playIdeaStore';

/** Mode D — curated screen-free sensory play ideas, tick off what's been tried. */
export function ScreenFreePlayIdeas() {
  const tried = usePlayIdeaStore((s) => s.tried);
  const toggle = usePlayIdeaStore((s) => s.toggle);
  const doneCount = SCREEN_FREE_PLAY_IDEAS.filter((idea) => tried[idea.id]).length;

  return (
    <Card>
      <CardTitle
        action={
          <Chip tone="neutral">
            {doneCount} از {SCREEN_FREE_PLAY_IDEAS.length}
          </Chip>
        }
      >
        ایده‌های بازی بدون اسکرین
      </CardTitle>

      <ul className="flex flex-col gap-1">
        {SCREEN_FREE_PLAY_IDEAS.map((idea) => {
          const done = Boolean(tried[idea.id]);
          return (
            <li key={idea.id}>
              <button
                type="button"
                onClick={() => toggle(idea.id)}
                aria-pressed={done}
                className="afrat-tap flex w-full items-center gap-3 rounded-xl px-1 py-2 text-start hover:bg-surface"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition',
                    done ? 'border-mint bg-mint text-white' : 'border-surface-border bg-surface-card',
                  )}
                >
                  {done ? <Check className="size-3.5" /> : <Sparkle className="size-3 text-ink-faint" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm', done ? 'text-ink-faint line-through' : 'text-ink')}>
                    {idea.label}
                  </span>
                  <span className="block text-[11px] text-ink-faint">{idea.ageRange}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
