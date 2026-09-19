'use client';

import { useState, type ComponentType } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { IconBadge } from '@/components/ui';
import { jalaliLong } from '@/lib/jalali';

import { useMilestoneMemoryStore, type MilestoneKind } from '../../store/milestoneMemoryStore';

const inputClass =
  'w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none';

export function MilestoneRow({
  kind,
  label,
  icon,
}: {
  kind: MilestoneKind;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  const entry = useMilestoneMemoryStore((s) => s.entries[kind]);
  const save = useMilestoneMemoryStore((s) => s.save);
  const remove = useMilestoneMemoryStore((s) => s.remove);

  const [editing, setEditing] = useState(false);
  const [at, setAt] = useState(entry?.at.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(entry?.note ?? '');
  const [photoUrl, setPhotoUrl] = useState(entry?.photoUrl);

  if (editing) {
    return (
      <li className="afrat-card p-3.5">
        <form
          className="flex flex-col gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            save(kind, { at: new Date(at).toISOString(), note: note.trim() || undefined, photoUrl });
            setEditing(false);
          }}
        >
          <p className="text-sm font-bold text-ink">{label}</p>
          <input type="date" value={at} onChange={(event) => setAt(event.target.value)} required className={inputClass} />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="یادداشت (اختیاری)"
            className={`${inputClass} resize-none`}
          />
          <input
            type="file"
            accept="image/*"
            aria-label="افزودن عکس"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPhotoUrl(URL.createObjectURL(file));
            }}
            className="text-xs text-ink-muted file:me-3 file:rounded-pill file:border-0 file:bg-primary/12 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-deep"
          />
          <div className="flex gap-2">
            <button type="submit" className="afrat-tap flex-1 rounded-pill bg-primary-deep py-2.5 text-sm font-bold text-white">
              ذخیره
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="afrat-tap rounded-pill bg-surface px-4 py-2.5 text-sm text-ink-muted"
            >
              انصراف
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="afrat-card flex items-center gap-3 p-3.5">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
      ) : (
        <IconBadge icon={icon} tone={entry ? 'mint' : 'neutral'} shape="pill" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        {entry ? (
          <>
            <p className="text-[11px] text-ink-muted">{jalaliLong(entry.at)}</p>
            {entry.note ? <p className="mt-0.5 text-[11px] leading-5 text-ink-faint">{entry.note}</p> : null}
          </>
        ) : (
          <p className="text-[11px] text-ink-faint">هنوز ثبت نشده</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`ثبت ${label}`}
        className="afrat-tap flex size-8 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      {entry ? (
        <button
          type="button"
          onClick={() => remove(kind)}
          aria-label={`حذف ${label}`}
          className="afrat-tap flex size-8 shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-coral"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}
