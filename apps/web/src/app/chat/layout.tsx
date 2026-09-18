import { AuthGate } from '@/modules/auth/components';

/**
 * The chatroom lives outside the tab group, so it needs its own gate —
 * a private consultation must never render for an unauthenticated visitor.
 */
export default function ChatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthGate>{children}</AuthGate>;
}
