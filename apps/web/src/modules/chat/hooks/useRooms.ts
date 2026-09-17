'use client';

import { useQuery } from '@tanstack/react-query';

import { listRooms } from '../api/chatApi';
import { DEMO_ROOMS } from '../data/demoRooms';
import type { ChatRoom } from '../types';

/**
 * Room list with a graceful degradation path: if the realtime service is
 * unreachable the UI still renders the known rooms instead of an error page.
 */
export function useRooms() {
  const query = useQuery<{ rooms: ChatRoom[] }>({
    queryKey: ['chat', 'rooms'],
    queryFn: listRooms,
    staleTime: 30_000,
  });

  return {
    rooms: query.data?.rooms ?? DEMO_ROOMS,
    isFallback: !query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useRoom(roomId: string): ChatRoom | undefined {
  const { rooms } = useRooms();
  return rooms.find((room) => room.id === roomId);
}
