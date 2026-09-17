'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { SectionTitle } from '@/components/ui';
import { RoomList } from '@/modules/chat/components/RoomList';
import { useRooms } from '@/modules/chat/hooks/useRooms';

export default function ChatIndexPage() {
  const { rooms, isLoading } = useRooms();

  const consults = rooms.filter((room) => room.kind === 'consult');
  const community = rooms.filter((room) => room.kind !== 'consult');

  return (
    <>
      <AppHeader title="گفتگو" subtitle="مشاوره، هم‌گروهی‌ها و انجمن‌ها" />

      <main className="afrat-page pt-3">
        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-card bg-surface-card" />
            ))}
          </div>
        ) : (
          <>
            {consults.length > 0 ? (
              <>
                <SectionTitle hint="پاسخ طی چند ساعت">مشاورهٔ تخصصی</SectionTitle>
                <RoomList rooms={consults} />
              </>
            ) : null}

            <SectionTitle hint={`${community.length} اتاق`}>
              اتاق‌های گفتگو
            </SectionTitle>
            <RoomList rooms={community} />
          </>
        )}
      </main>
    </>
  );
}
