'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Mic, Send, Square, X } from 'lucide-react';

import { formatFaUnit } from '@/lib/persian';
import { cn } from '@/lib/utils';

import { uploadAttachment } from '../api/chatApi';
import type { Attachment } from '../types';
import type { SendOptions } from '../hooks/useChatSocket';

interface MessageComposerProps {
  roomId: string;
  disabled?: boolean;
  disabledReason?: string;
  onSend: (body: string, options?: SendOptions) => Promise<void> | void;
  onTyping: (typing: boolean) => void;
}

const MAX_ROWS = 5;

export function MessageComposer({
  roomId,
  disabled,
  disabledReason,
  onSend,
  onTyping,
}: MessageComposerProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedSec, setRecordedSec] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Grow the textarea up to MAX_ROWS, then scroll internally. */
  const autosize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '24');
    el.style.height = `${Math.min(el.scrollHeight, lineHeight * MAX_ROWS)}px`;
  }, []);

  useEffect(autosize, [value, autosize]);

  useEffect(
    () => () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      // Release any blob previews we created for optimistic rendering.
      attachments.forEach((a) => {
        if (a.localPreviewUrl) URL.revokeObjectURL(a.localPreviewUrl);
      });
    },
    // Intentionally cleanup-only: runs on unmount with the latest closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled;

  const submit = async () => {
    if (!canSend) return;
    const body = value;
    const pending = attachments;

    setValue('');
    setAttachments([]);
    requestAnimationFrame(autosize);

    await onSend(body, {
      attachments: pending.length ? pending : undefined,
      kind: pending.length ? pending[0].kind : 'text',
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends on desktop; Shift+Enter is a newline. On touch keyboards the
    // Enter key inserts a newline, so the send button is the primary path.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      if (!isTouch) {
        event.preventDefault();
        void submit();
      }
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 4)) {
        const localPreviewUrl = URL.createObjectURL(file);
        const uploaded = await uploadAttachment({
          roomId,
          file,
          kind: file.type.startsWith('image/') ? 'image' : 'file',
        });
        setAttachments((prev) => [...prev, { ...uploaded, localPreviewUrl }]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const durationSec = recordedSec;
        setRecordedSec(0);
        if (blob.size === 0) return;

        setUploading(true);
        try {
          const uploaded = await uploadAttachment({
            roomId,
            file: blob,
            kind: 'voice',
            fileName: `voice-${Date.now()}.webm`,
            durationSec,
          });
          await onSend('', { kind: 'voice', attachments: [uploaded] });
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      recordTimerRef.current = setInterval(
        () => setRecordedSec((s) => s + 1),
        1000,
      );
    } catch {
      // Permission denied or no microphone — stay silent, the button resets.
      setRecording(false);
    }
  };

  const stopRecording = (discard = false) => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setRecording(false);
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (discard) {
      recorder.onstop = () => recorder.stream.getTracks().forEach((t) => t.stop());
      setRecordedSec(0);
    }
    recorder.stop();
    recorderRef.current = null;
  };

  if (disabled) {
    return (
      <div className="border-t border-surface-border bg-surface-card px-4 py-3 text-center text-sm text-ink-muted afrat-safe-bottom">
        {disabledReason ?? 'ارسال پیام در این اتاق ممکن نیست.'}
      </div>
    );
  }

  return (
    <div className="border-t border-surface-border bg-surface-card afrat-safe-bottom">
      {attachments.length > 0 ? (
        <ul className="flex gap-2 overflow-x-auto px-3 pt-3 afrat-scroll-hidden">
          {attachments.map((attachment, index) => (
            <li key={attachment.id} className="relative shrink-0">
              {attachment.kind === 'image' ? (
                <img
                  src={attachment.localPreviewUrl ?? attachment.url}
                  alt=""
                  className="size-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 px-1 text-[10px] text-primary-deep">
                  {attachment.kind === 'voice' ? 'صوت' : 'فایل'}
                </div>
              )}
              <button
                type="button"
                aria-label="حذف پیوست"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== index))
                }
                className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-ink text-white"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {recording ? (
        <div className="flex items-center gap-3 px-3 py-3">
          <button
            type="button"
            onClick={() => stopRecording(true)}
            className="afrat-tap flex size-10 items-center justify-center rounded-full bg-surface text-ink-muted"
            aria-label="لغو ضبط"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <div className="flex flex-1 items-center gap-2 text-sm text-ink">
            <span className="size-2.5 animate-pulse rounded-full bg-coral" aria-hidden="true" />
            <span aria-live="polite">
              در حال ضبط — {formatFaUnit(recordedSec, 'ثانیه', 0)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => stopRecording(false)}
            className="afrat-tap flex size-10 items-center justify-center rounded-full bg-primary-deep text-white"
            aria-label="پایان ضبط و ارسال"
          >
            <Square className="size-4 fill-current" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2 px-3 py-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(event) => void handleFiles(event.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="afrat-tap flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface disabled:opacity-50"
            aria-label="پیوست تصویر یا فایل"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-5" aria-hidden="true" />
            )}
          </button>

          <label className="sr-only" htmlFor="afrat-composer">
            متن پیام
          </label>
          <textarea
            id="afrat-composer"
            ref={textareaRef}
            rows={1}
            value={value}
            dir="auto"
            placeholder="پیام خود را بنویسید…"
            onChange={(event) => {
              setValue(event.target.value);
              onTyping(event.target.value.length > 0);
            }}
            onBlur={() => onTyping(false)}
            onKeyDown={handleKeyDown}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-surface-border bg-surface px-3.5 py-2.5 text-sm leading-6 text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />

          {canSend ? (
            <button
              type="button"
              onClick={() => void submit()}
              className="afrat-tap flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-deep text-white shadow-raised"
              aria-label="ارسال پیام"
            >
              {/* RTL: the send arrow must point to the inline-end (left). */}
              <Send className="size-5 -scale-x-100" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording()}
              className={cn(
                'afrat-tap flex size-10 shrink-0 items-center justify-center rounded-full',
                'bg-primary/15 text-primary-deep',
              )}
              aria-label="ضبط پیام صوتی"
            >
              <Mic className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
