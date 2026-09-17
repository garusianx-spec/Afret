'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ChatRoom } from '@/modules/chat/components/ChatRoom';
import { useRoom } from '@/modules/chat/hooks/useRooms';

/**
 * Lives outside the `(tabs)` group on purpose: a conversation gets the whole
 * viewport, with its own composer pinned to the safe-area inset instead of the
 * five-tab bar.
 */
export default function ChatRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId ?? '';
  const room = useRoom(roomId);

  if (!room) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-sm text-ink-muted">این اتاق گفتگو پیدا نشد.</p>
        <Link
          href="/chat"
          className="afrat-tap rounded-pill bg-primary-deep px-4 py-2.5 text-sm font-bold text-white"
        >
          بازگشت به فهرست گفتگوها
        </Link>
      </div>
    );
  }

  return <ChatRoom room={room} />;
}
