'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ChevronRight, Loader2, MoreVertical } from 'lucide-react';
import Link from 'next/link';

import { jalaliDayKey } from '@/lib/jalali';
import { formatFaRelative, toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/store/authStore';

import { useChatSocket } from '../hooks/useChatSocket';
import type { ChatMessage, ChatRoom as ChatRoomModel } from '../types';
import { ConnectionBanner } from './ConnectionBanner';
import { DateSeparator } from './DateSeparator';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';

interface ChatRoomProps {
  room: ChatRoomModel;
  backHref?: string;
}

/** Same author within this window ⇒ one visual group. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function ChatRoom({ room, backHref = '/chat' }: ChatRoomProps) {
  const meId = useAuthStore((s) => s.user?.id ?? 'anonymous');

  const {
    status,
    messages,
    typingUsers,
    onlineUserIds,
    isLoadingHistory,
    hasMoreHistory,
    pendingCount,
    sendMessage,
    retryMessage,
    loadOlder,
    setTyping,
    markReadUpTo,
    toggleReaction,
  } = useChatSocket({ roomId: room.id });

  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const prevHeightRef = useRef(0);

  /* Keep the viewport pinned to the newest message unless the user has
     scrolled up to read history. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    } else if (prevHeightRef.current) {
      // An older page was prepended — preserve the reading position.
      el.scrollTop += el.scrollHeight - prevHeightRef.current;
    }
    prevHeightRef.current = el.scrollHeight;
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  /* Infinite history: load the next older page when the top comes into view. */
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasMoreHistory) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingHistory) {
          prevHeightRef.current = root.scrollHeight;
          void loadOlder();
        }
      },
      { root, rootMargin: '120px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreHistory, isLoadingHistory, loadOlder]);

  /* Read receipts: once the newest message is on screen and the tab is
     visible, report our cursor. */
  useEffect(() => {
    const latest = messages.reduce(
      (acc, m) => (m.seq != null && m.seq > acc ? m.seq : acc),
      0,
    );
    if (!latest) return;

    const report = () => {
      if (document.visibilityState === 'visible' && atBottomRef.current) {
        markReadUpTo(latest);
      }
    };
    report();
    document.addEventListener('visibilitychange', report);
    return () => document.removeEventListener('visibilitychange', report);
  }, [messages, markReadUpTo]);

  /** Flatten into render rows, inserting Jalali day separators. */
  const rows = useMemo(() => buildRows(messages, meId), [messages, meId]);

  const subtitle = (() => {
    if (room.kind === 'consult' && room.counterpart) {
      return onlineUserIds.includes(room.counterpart.id)
        ? 'آنلاین'
        : (room.counterpart.roleLabel ?? 'مشاوره خصوصی');
    }
    const online = onlineUserIds.length;
    return online > 0
      ? `${toFaDigits(room.memberCount)} عضو · ${toFaDigits(online)} آنلاین`
      : `${toFaDigits(room.memberCount)} عضو`;
  })();

  return (
    <div className="flex h-[100dvh] flex-col bg-surface">
      <header className="afrat-safe-top sticky top-0 z-20 border-b border-surface-border bg-surface-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2 px-2 py-2.5">
          <Link
            href={backHref}
            className="afrat-tap flex size-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
            aria-label="بازگشت به فهرست گفتگوها"
          >
            {/* RTL: "back" points to the inline-end, i.e. the right chevron. */}
            <ChevronRight className="size-5" aria-hidden="true" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-ink">{room.title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-ink-muted">{subtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            className="afrat-tap flex size-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
            aria-label="گزینه‌های گفتگو"
          >
            <MoreVertical className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ConnectionBanner status={status} pendingCount={pendingCount} />
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain py-3"
        role="log"
        aria-label={`پیام‌های ${room.title}`}
        aria-live="polite"
        aria-relevant="additions"
      >
        {/* `justify-end` + `min-h-full` keeps a short conversation resting on
            the composer instead of floating at the top of the viewport. */}
        <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-end">
          <div ref={topSentinelRef} aria-hidden="true" />

          {isLoadingHistory ? (
            <div className="flex justify-center py-3 text-ink-muted">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">در حال بارگذاری پیام‌های قدیمی‌تر</span>
            </div>
          ) : null}

          {!hasMoreHistory && messages.length > 0 ? (
            <p className="py-3 text-center text-xs text-ink-faint">
              ابتدای گفتگو — {formatFaRelative(messages[0].createdAt)}
            </p>
          ) : null}

          {rows.map((row) =>
            row.type === 'day' ? (
              <DateSeparator key={row.key} date={row.date} />
            ) : (
              <MessageBubble
                key={row.message.id || row.message.clientId}
                message={row.message}
                isOwn={row.isOwn}
                isGroupStart={row.isGroupStart}
                isGroupEnd={row.isGroupEnd}
                onRetry={retryMessage}
                onToggleReaction={toggleReaction}
              />
            ),
          )}

          {rows.length === 0 && !isLoadingHistory ? (
            <EmptyRoom kind={room.kind} />
          ) : null}
        </div>
      </div>

      <TypingIndicator users={typingUsers} />

      <MessageComposer
        roomId={room.id}
        disabled={room.locked}
        disabledReason="این اتاق در حال حاضر فقط خواندنی است."
        onSend={sendMessage}
        onTyping={setTyping}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Row =
  | { type: 'day'; key: string; date: string }
  | {
      type: 'message';
      key: string;
      message: ChatMessage;
      isOwn: boolean;
      isGroupStart: boolean;
      isGroupEnd: boolean;
    };

function buildRows(messages: ChatMessage[], meId: string): Row[] {
  const rows: Row[] = [];
  let lastDayKey = '';

  messages.forEach((message, index) => {
    const dayKey = jalaliDayKey(message.createdAt);
    if (dayKey !== lastDayKey) {
      rows.push({ type: 'day', key: `day_${dayKey}`, date: message.createdAt });
      lastDayKey = dayKey;
    }

    const previous = messages[index - 1];
    const next = messages[index + 1];
    const sameAuthorAs = (other?: ChatMessage) =>
      Boolean(
        other &&
          other.authorId === message.authorId &&
          other.kind !== 'system' &&
          Math.abs(
            Date.parse(other.createdAt) - Date.parse(message.createdAt),
          ) < GROUP_WINDOW_MS,
      );

    const previousSameDay =
      previous && jalaliDayKey(previous.createdAt) === dayKey;

    rows.push({
      type: 'message',
      key: message.id || message.clientId,
      message,
      isOwn: message.authorId === meId,
      isGroupStart: !previousSameDay || !sameAuthorAs(previous),
      isGroupEnd:
        !next ||
        jalaliDayKey(next.createdAt) !== dayKey ||
        !sameAuthorAs(next),
    });
  });

  return rows;
}

function EmptyRoom({ kind }: { kind: ChatRoomModel['kind'] }) {
  const copy =
    kind === 'consult'
      ? 'اولین سؤال خود را از پزشک بپرسید. پاسخ معمولاً طی چند ساعت ارسال می‌شود.'
      : 'هنوز پیامی در این اتاق نیست. شما می‌توانید اولین نفر باشید.';

  return (
    <div className={cn('flex flex-col items-center gap-2 px-8 py-16 text-center')}>
      <span aria-hidden="true" className="text-3xl">
        🌸
      </span>
      <p className="text-sm leading-7 text-ink-muted">{copy}</p>
    </div>
  );
}
