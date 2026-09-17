import { toFaDigits } from '@/lib/persian';

interface TypingIndicatorProps {
  users: { userId: string; displayName: string }[];
}

/** «مریم در حال نوشتن…» — announced politely to screen readers. */
export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const label =
    users.length === 1
      ? `${users[0].displayName} در حال نوشتن…`
      : users.length === 2
        ? `${users[0].displayName} و ${users[1].displayName} در حال نوشتن…`
        : `${toFaDigits(users.length)} نفر در حال نوشتن…`;

  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5 text-xs text-ink-muted"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-primary animate-typing-dot"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}
