'use client';

import { FileText, Play, RotateCw } from 'lucide-react';

import { formatFaTime, formatFaUnit, toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import type { Attachment, ChatMessage } from '../types';
import { DeliveryTicks } from './DeliveryTicks';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  /** First bubble of a run by the same author — shows avatar + name. */
  isGroupStart: boolean;
  /** Last bubble of a run — carries the tail and the timestamp. */
  isGroupEnd: boolean;
  onRetry?: (clientId: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  doctor: { label: 'پزشک', className: 'bg-primary-deep text-white' },
  midwife: { label: 'ماما', className: 'bg-primary/20 text-primary-deep' },
  nutritionist: { label: 'کارشناس تغذیه', className: 'bg-mint-soft text-mint' },
  moderator: { label: 'ناظر', className: 'bg-coral-soft text-coral' },
};

export function MessageBubble({
  message,
  isOwn,
  isGroupStart,
  isGroupEnd,
  onRetry,
  onToggleReaction,
}: MessageBubbleProps) {
  if (message.kind === 'system') {
    return (
      <p className="my-3 text-center text-xs text-ink-faint">{message.body}</p>
    );
  }

  const badge = message.author?.role ? ROLE_BADGES[message.author.role] : undefined;
  const failed = message.delivery === 'failed';

  return (
    <div
      className={cn(
        'flex w-full gap-2 px-3 animate-fade-up',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        isGroupEnd ? 'mb-2.5' : 'mb-0.5',
      )}
    >
      {/* Avatar column — reserved even when hidden so bubbles stay aligned. */}
      <div className="w-8 shrink-0">
        {!isOwn && isGroupStart ? (
          <Avatar
            name={message.author?.displayName ?? '؟'}
            src={message.author?.avatarUrl}
          />
        ) : null}
      </div>

      <div
        className={cn(
          'flex min-w-0 max-w-[78%] flex-col',
          isOwn ? 'items-start' : 'items-end',
        )}
      >
        {!isOwn && isGroupStart ? (
          <div className="mb-1 flex items-center gap-1.5 px-1">
            <span className="text-xs font-semibold text-ink">
              {message.author?.displayName}
            </span>
            {badge ? (
              <span
                className={cn(
                  'rounded-pill px-1.5 py-0.5 text-[10px] font-medium',
                  badge.className,
                )}
              >
                {message.author?.roleLabel ?? badge.label}
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            'rounded-bubble px-3 py-2 text-sm leading-7 shadow-sm',
            isOwn
              ? 'bg-primary-deep text-white'
              : 'border border-surface-border bg-surface-card text-ink',
            // Flatten the corner on the speaker's side to form the tail.
            isGroupEnd && (isOwn ? 'rounded-es-md' : 'rounded-ee-md'),
            failed && 'ring-1 ring-coral',
          )}
        >
          {message.replyTo ? (
            <QuotedReply
              body={message.replyTo.body}
              kind={message.replyTo.kind}
              isOwn={isOwn}
            />
          ) : null}

          {message.attachments?.length ? (
            <div className="mb-1.5 flex flex-col gap-1.5">
              {message.attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  isOwn={isOwn}
                />
              ))}
            </div>
          ) : null}

          {message.body ? (
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          ) : null}

          <div
            className={cn(
              'mt-1 flex items-center gap-1.5',
              isOwn ? 'justify-start text-white/70' : 'justify-end text-ink-faint',
            )}
          >
            <time
              dateTime={message.createdAt}
              className="text-[10px] tabular-nums"
            >
              {formatFaTime(message.createdAt)}
            </time>
            {isOwn ? <DeliveryTicks state={message.delivery} /> : null}
          </div>
        </div>

        {message.reactions && Object.keys(message.reactions).length ? (
          <div className="mt-1 flex flex-wrap gap-1 px-1">
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction?.(message.id, emoji)}
                className="afrat-tap flex items-center gap-1 rounded-pill border border-surface-border bg-surface-card px-2 py-0.5 text-xs"
                aria-label={`${emoji} — ${toFaDigits(userIds.length)} نفر`}
              >
                <span aria-hidden="true">{emoji}</span>
                <span className="tabular-nums text-ink-muted">
                  {toFaDigits(userIds.length)}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {failed ? (
          <button
            type="button"
            onClick={() => onRetry?.(message.clientId)}
            className="afrat-tap mt-1 flex items-center gap-1 px-1 text-xs font-medium text-coral"
          >
            <RotateCw className="size-3.5" aria-hidden="true" />
            {message.error ?? 'ارسال نشد'} — تلاش دوباره
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-8 rounded-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-deep"
    >
      {name.slice(0, 1)}
    </span>
  );
}

function QuotedReply({
  body,
  kind,
  isOwn,
}: {
  body: string;
  kind: ChatMessage['kind'];
  isOwn: boolean;
}) {
  const preview =
    kind === 'image' ? 'تصویر' : kind === 'voice' ? 'پیام صوتی' : body;
  return (
    <div
      className={cn(
        // Border sits on the inline-start edge, which RTL flips automatically.
        'mb-1.5 border-s-2 ps-2 text-xs opacity-80 line-clamp-2',
        isOwn ? 'border-white/50' : 'border-primary',
      )}
    >
      {preview}
    </div>
  );
}

function AttachmentPreview({
  attachment,
  isOwn,
}: {
  attachment: Attachment;
  isOwn: boolean;
}) {
  const src = attachment.localPreviewUrl ?? attachment.url;

  if (attachment.kind === 'image') {
    return (
      <img
        src={src}
        alt={attachment.fileName ?? 'تصویر پیوست'}
        loading="lazy"
        className={cn(
          'max-h-64 w-full rounded-xl object-cover',
          attachment.localPreviewUrl && 'opacity-70',
        )}
        width={attachment.width}
        height={attachment.height}
      />
    );
  }

  if (attachment.kind === 'voice') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl px-2 py-1.5',
          isOwn ? 'bg-white/15' : 'bg-primary/10',
        )}
      >
        <button
          type="button"
          className="afrat-tap flex size-8 items-center justify-center rounded-full bg-primary-deep text-white"
          aria-label="پخش پیام صوتی"
        >
          <Play className="size-4" aria-hidden="true" />
        </button>
        {/* Static waveform placeholder; swap for a real peaks renderer. */}
        <span className="flex h-6 flex-1 items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'w-0.5 rounded-full',
                isOwn ? 'bg-white/60' : 'bg-primary/60',
              )}
              style={{ height: `${25 + ((i * 37) % 60)}%` }}
            />
          ))}
        </span>
        <span className="text-[10px] tabular-nums opacity-80">
          {attachment.durationSec
            ? formatFaUnit(attachment.durationSec, 'ثانیه', 0)
            : ''}
        </span>
      </div>
    );
  }

  return (
    <a
      href={attachment.url}
      download={attachment.fileName}
      className={cn(
        'flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs',
        isOwn ? 'bg-white/15' : 'bg-primary/10',
      )}
    >
      <FileText className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{attachment.fileName ?? 'فایل پیوست'}</span>
      <span className="shrink-0 opacity-70">
        {formatFaUnit(attachment.sizeBytes / 1024 / 1024, 'مگابایت')}
      </span>
    </a>
  );
}
