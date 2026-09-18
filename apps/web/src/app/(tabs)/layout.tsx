import { BottomNav } from '@/components/layout/BottomNav';
import { AuthGate } from '@/modules/auth/components';

/**
 * Shell for the five persistent tabs. The chatroom route lives outside this
 * group so a full-height conversation can own the whole viewport.
 */
export default function TabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGate>
      <div className="min-h-[100dvh] bg-surface">
        {children}
        <BottomNav />
      </div>
    </AuthGate>
  );
}
