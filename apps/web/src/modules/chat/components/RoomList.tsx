'use client';

import Link from 'next/link';
import {
  HeartPulse,
  MessagesSquare,
  Sparkles,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { formatFaRelative, toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import type { ChatRoom, RoomKind } from '../types';

const KIND_ICON: Record<RoomKind, LucideIcon> = {
  consult: Stethoscope,
  cohort: Users,
  topic: MessagesSquare,
  highrisk: HeartPulse,
  ttc: Sparkles,
};

const KIND_TONE: Record<RoomKind, string> = {
  consult: 'bg-primary-deep text-white',
  cohort: 'bg-primary/15 text-primary-deep',
  topic: 'bg-mint-soft text-mint',
  highrisk: 'bg-coral-soft text-ink',
  ttc: 'bg-primary/15 text-primary-deep',
};

export function RoomList({ rooms }: { rooms: ChatRoom[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {rooms.map((room) => {
        const Icon = KIND_ICON[room.kind];

        return (
          <li key={room.id}>
            <Link
              href={`/chat/${room.id}`}
              className="afrat-card flex items-center gap-3 p-3"
            >
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                  KIND_TONE[room.kind],
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-sm font-bold text-ink">
                    {room.title}
                  </h3>
                  {room.lastMessage ? (
                    <span className="shrink-0 text-[10px] text-ink-faint">
                      {formatFaRelative(room.lastMessage.createdAt)}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-ink-muted">
                  {room.lastMessage?.body ?? room.description ?? ''}
                </p>
              </div>

              {room.unreadCount > 0 ? (
                <span
                  className="flex min-w-5 shrink-0 items-center justify-center rounded-pill bg-primary-deep px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums"
                  aria-label={`${toFaDigits(room.unreadCount)} پیام خوانده‌نشده`}
                >
                  {toFaDigits(room.unreadCount)}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
