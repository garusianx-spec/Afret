'use client';

import { Check } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import type { ChecklistTemplateItem } from '../data/checklists';
import { useToolkitStore } from '../store/toolkitStore';

export function ToolkitChecklist({
  listId,
  title,
  items,
}: {
  listId: string;
  title: string;
  items: ChecklistTemplateItem[];
}) {
  const checked = useToolkitStore((s) => s.checked[listId]);
  const toggle = useToolkitStore((s) => s.toggleItem);

  const done = items.filter((item) => checked?.[item.id]).length;
  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <Card>
      <CardTitle
        action={
          <span className="text-xs font-medium text-ink-muted tabular-nums">
            {toFaDigits(done)} از {toFaDigits(items.length)}
          </span>
        }
      >
        {title}
      </CardTitle>

      <div
        className="mb-3 h-1.5 overflow-hidden rounded-pill bg-surface"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={done}
        aria-label={`پیشرفت ${title}`}
      >
        <div
          className="h-full bg-mint transition-[width] duration-500"
          style={{ width: `${(done / items.length) * 100}%` }}
        />
      </div>

      {groups.map((group) => (
        <fieldset key={group} className="mb-3 last:mb-0">
          <legend className="mb-1.5 text-[11px] font-bold text-primary-deep">
            {group}
          </legend>
          <ul className="flex flex-col gap-0.5">
            {items
              .filter((item) => item.group === group)
              .map((item) => {
                const isChecked = Boolean(checked?.[item.id]);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={isChecked}
                      onClick={() => toggle(listId, item.id)}
                      className="afrat-tap flex w-full items-center gap-2.5 rounded-xl px-1 py-1.5 text-start hover:bg-surface"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition',
                          isChecked
                            ? 'border-mint bg-mint text-white'
                            : 'border-surface-border',
                        )}
                      >
                        {isChecked ? <Check className="size-3" /> : null}
                      </span>
                      <span
                        className={cn(
                          'flex-1 text-sm',
                          isChecked ? 'text-ink-faint line-through' : 'text-ink',
                        )}
                      >
                        {item.label}
                      </span>
                      {item.essential && !isChecked ? (
                        <span className="shrink-0 rounded-pill bg-coral-soft px-1.5 py-0.5 text-[10px] text-ink">
                          ضروری
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
          </ul>
        </fieldset>
      ))}
    </Card>
  );
}
