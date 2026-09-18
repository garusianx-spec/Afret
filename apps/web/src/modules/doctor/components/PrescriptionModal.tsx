'use client';

import { useState } from 'react';
import { Loader2, Salad, Stethoscope, X } from 'lucide-react';

import { createId } from '@/lib/utils';
import { sendMessageHttp } from '@/modules/chat/api/chatApi';

interface PrescriptionModalProps {
  patientName: string;
  roomId: string;
  onClose: () => void;
}

/**
 * Assigns a diet plan or clinical recommendation to one patient.
 *
 * This is not a separate "prescriptions" data model — it composes a single
 * structured message and sends it through the same real chat pipeline every
 * other message uses. The patient sees it in her consultation thread the
 * instant it's sent, which is exactly where a mother expects to find
 * something her doctor told her, rather than a second inbox she'd have to
 * remember to check.
 */
export function PrescriptionModal({ patientName, roomId, onClose }: PrescriptionModalProps) {
  const [kind, setKind] = useState<'diet' | 'note'>('diet');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snack, setSnack] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildDietBody = () => {
    const lines = ['📋 برنامهٔ غذایی تجویزشده', ''];
    if (breakfast.trim()) lines.push(`صبحانه: ${breakfast.trim()}`);
    if (snack.trim()) lines.push(`میان‌وعده: ${snack.trim()}`);
    if (lunch.trim()) lines.push(`ناهار: ${lunch.trim()}`);
    if (dinner.trim()) lines.push(`شام: ${dinner.trim()}`);
    if (note.trim()) lines.push('', note.trim());
    return lines.join('\n');
  };

  const canSend =
    kind === 'note'
      ? note.trim().length > 0
      : [breakfast, lunch, dinner, snack].some((v) => v.trim().length > 0);

  const submit = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);
    try {
      const body = kind === 'diet' ? buildDietBody() : `🩺 توصیهٔ پزشک\n\n${note.trim()}`;
      await sendMessageHttp({
        clientId: createId('rx'),
        roomId,
        kind: 'text',
        body,
      });
      onClose();
    } catch {
      setError('ارسال ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="تجویز و تخصیص برنامهٔ غذایی"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-card bg-surface-card p-5 shadow-raised sm:rounded-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">برای {patientName}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="afrat-tap flex size-8 items-center justify-center rounded-full text-ink-faint hover:bg-surface"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" className="mb-4 flex rounded-pill bg-surface p-1">
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'diet'}
            onClick={() => setKind('diet')}
            className={`afrat-tap flex flex-1 items-center justify-center gap-1.5 rounded-pill py-2 text-xs font-bold transition ${
              kind === 'diet' ? 'bg-primary-deep text-white' : 'text-ink-muted'
            }`}
          >
            <Salad className="size-3.5" aria-hidden="true" />
            برنامهٔ غذایی
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'note'}
            onClick={() => setKind('note')}
            className={`afrat-tap flex flex-1 items-center justify-center gap-1.5 rounded-pill py-2 text-xs font-bold transition ${
              kind === 'note' ? 'bg-primary-deep text-white' : 'text-ink-muted'
            }`}
          >
            <Stethoscope className="size-3.5" aria-hidden="true" />
            توصیهٔ بالینی
          </button>
        </div>

        {kind === 'diet' ? (
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'صبحانه', value: breakfast, set: setBreakfast, placeholder: 'مثلاً نان سنگک با پنیر و گردو' },
              { label: 'میان‌وعده', value: snack, set: setSnack, placeholder: 'مثلاً یک عدد میوه و چند مغز خام' },
              { label: 'ناهار', value: lunch, set: setLunch, placeholder: 'مثلاً چلوخورش قورمه‌سبزی با گوشت کم‌چرب' },
              { label: 'شام', value: dinner, set: setDinner, placeholder: 'مثلاً سوپ سبزیجات با نان سبوس‌دار' },
            ].map((field) => (
              <label key={field.label} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink-muted">{field.label}</span>
                <input
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </label>
            ))}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink-muted">توضیح تکمیلی (اختیاری)</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                className="resize-none rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </div>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-muted">متن توصیه</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              placeholder="مثلاً: مصرف آهن را به دو نوبت در روز افزایش دهید…"
              className="resize-none rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </label>
        )}

        {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}

        <button
          type="button"
          disabled={!canSend || sending}
          onClick={() => void submit()}
          className="afrat-tap mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-primary-deep py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {sending ? 'در حال ارسال…' : 'ارسال به بیمار'}
        </button>
        <p className="mt-2 text-center text-[10px] text-ink-faint">
          این پیام مستقیماً در گفتگوی مشاوره ارسال می‌شود.
        </p>
      </div>
    </div>
  );
}
