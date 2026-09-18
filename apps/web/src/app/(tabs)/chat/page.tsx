'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { SectionTitle } from '@/components/ui';
import { useAuth } from '@/modules/auth';
import { RoomList } from '@/modules/chat/components/RoomList';
import { useRooms } from '@/modules/chat/hooks/useRooms';

export default function ChatIndexPage() {
  const { rooms, isLoading } = useRooms();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const consults = rooms.filter((room) => room.kind === 'consult');
  const community = rooms.filter((room) => room.kind !== 'consult');

  // A clinician's inbox is her consultations, full stop — the open
  // community rooms (cohorts, topic forums) are mother-facing content she
  // has no reason to see here; her patient list already links straight into
  // each consult room anyway.
  if (isDoctor) {
    return (
      <>
        <AppHeader title="صندوق مشاوره" subtitle="گفتگوهای خصوصی با مراجعین" />
        <main className="afrat-page pt-3">
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-card bg-surface-card" />
              ))}
            </div>
          ) : (
            <RoomList rooms={consults} />
          )}
        </main>
      </>
    );
  }

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
