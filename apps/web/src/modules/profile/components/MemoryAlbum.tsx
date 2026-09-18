'use client';

import { useState } from 'react';
import { Camera, Plus, Trash2 } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { jalaliLong } from '@/lib/jalali';
import { createId } from '@/lib/utils';

import { useToolkitStore } from '../store/toolkitStore';

/**
 * Digital memory album. Photos are held as object URLs in this build; wire
 * `uploadAttachment` from the chat module to persist them to cloud storage.
 */
export function MemoryAlbum() {
  const memories = useToolkitStore((s) => s.memories);
  const addMemory = useToolkitStore((s) => s.addMemory);
  const removeMemory = useToolkitStore((s) => s.removeMemory);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [at, setAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  return (
    <Card id="memories">
      <CardTitle
        action={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="afrat-tap flex items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-deep"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            خاطرهٔ جدید
          </button>
        }
      >
        آلبوم خاطرات
      </CardTitle>

      {open ? (
        <form
          className="mb-4 flex flex-col gap-2 rounded-xl bg-surface p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            addMemory({
              id: createId('mem'),
              title: title.trim(),
              at: new Date(at).toISOString(),
              note: note.trim() || undefined,
            });
            setTitle('');
            setNote('');
            setOpen(false);
          }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً: اولین لبخند"
            aria-label="عنوان خاطره"
            className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="date"
            value={at}
            onChange={(event) => setAt(event.target.value)}
            aria-label="تاریخ خاطره"
            className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="یادداشت (اختیاری)"
            aria-label="یادداشت خاطره"
            className="resize-none rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="afrat-tap rounded-pill bg-primary-deep px-4 py-2 text-sm font-bold text-white"
          >
            ذخیره
          </button>
        </form>
      ) : null}

      {memories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Camera className="size-7 text-ink-faint" aria-hidden="true" />
          <p className="text-xs leading-6 text-ink-muted">
            اولین لبخند، اولین دندان، اولین قدم — هیچ‌کدام تکرار نمی‌شوند.
            <br />
            همین حالا ثبتشان کنید.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {memories.map((memory) => (
            <li
              key={memory.id}
              className="flex items-center gap-3 rounded-xl bg-surface p-3"
            >
              {memory.photoUrl ? (
                <img
                  src={memory.photoUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-lg"
                >
                  ✨
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{memory.title}</p>
                <p className="text-[11px] text-ink-muted">{jalaliLong(memory.at)}</p>
                {memory.note ? (
                  <p className="mt-0.5 text-[11px] leading-5 text-ink-faint">
                    {memory.note}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => removeMemory(memory.id)}
                aria-label={`حذف خاطرهٔ ${memory.title}`}
                className="afrat-tap shrink-0 text-ink-faint hover:text-coral"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
