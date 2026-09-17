import type { ChatRoom } from '../types';

/**
 * Fallback room list rendered when the realtime service is unreachable —
 * during `next dev` without `apps/realtime`, or offline on a cold cache.
 * The live list comes from `GET /api/chat/rooms`.
 */
export const DEMO_ROOMS: ChatRoom[] = [
  {
    id: 'consult_dr_ahmadi',
    kind: 'consult',
    title: 'دکتر سارا احمدی',
    description: 'مشاورهٔ خصوصی',
    counterpart: {
      id: 'u_dr_ahmadi',
      displayName: 'دکتر سارا احمدی',
      role: 'doctor',
      roleLabel: 'متخصص زنان و زایمان',
    },
    memberCount: 2,
    unreadCount: 2,
  },
  {
    id: 'cohort_1404_azar',
    kind: 'cohort',
    title: 'مادران آذر ۱۴۰۴',
    description: 'هم‌گروهی‌های تاریخ زایمان',
    memberCount: 1840,
    unreadCount: 12,
  },
  {
    id: 'topic_nutrition',
    kind: 'topic',
    title: 'تغذیه در بارداری',
    description: 'تبادل تجربه و دستور غذایی',
    memberCount: 5210,
    unreadCount: 0,
  },
  {
    id: 'highrisk',
    kind: 'highrisk',
    title: 'بارداری پرخطر',
    description: 'پشتیبانی تخصصی و همدلی',
    memberCount: 730,
    unreadCount: 3,
  },
  {
    id: 'ttc',
    kind: 'ttc',
    title: 'در تلاش برای بارداری',
    description: 'ردیابی تخمک‌گذاری و تجربه‌ها',
    memberCount: 2410,
    unreadCount: 0,
  },
];

export function findDemoRoom(roomId: string): ChatRoom | undefined {
  return DEMO_ROOMS.find((room) => room.id === roomId);
}
