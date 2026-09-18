import { toEnDigits } from '@/lib/persian';

/**
 * Client-side mirror of the server's mobile normaliser.
 *
 * Duplicated deliberately: the server must never trust this, and the client
 * must not need a round-trip to tell the user their number is malformed. The
 * canonical form is `+989XXXXXXXXX`.
 */
const CANONICAL = /^\+989\d{9}$/;

export function normalizeMobile(input: string): string | null {
  if (!input) return null;

  let s = toEnDigits(String(input)).replace(/[\s()\-._]/g, '');

  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (s.startsWith('98') && !s.startsWith('+')) s = `+${s}`;
  if (s.startsWith('0')) s = `+98${s.slice(1)}`;
  else if (/^9\d{9}$/.test(s)) s = `+98${s}`;
  else if (!s.startsWith('+')) return null;

  return CANONICAL.test(s) ? s : null;
}

export function isValidMobile(input: string): boolean {
  return normalizeMobile(input) !== null;
}

/** `+989123456789` → `۰۹۱۲ ۳۴۵ ۶۷۸۹`, how a Persian speaker reads it back. */
export function formatMobileForDisplay(canonical: string): string {
  const national = `0${canonical.slice(3)}`;
  const grouped = `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
  return grouped.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export interface PasswordStrength {
  /** 0–4. Drives the meter and gates the submit button at >= 2. */
  score: number;
  label: string;
  hints: string[];
}

/**
 * Advisory strength meter. The authoritative policy lives on the server —
 * this exists so the user is not told "too weak" only after a round-trip.
 */
export function scorePassword(raw: string): PasswordStrength {
  const value = toEnDigits(raw ?? '');
  const hints: string[] = [];

  if (value.length < 8) hints.push('حداقل ۸ نویسه');
  if (!/[0-9]/.test(value)) hints.push('حداقل یک رقم');
  if (!/[A-Za-z؀-ۿ]/.test(value)) hints.push('حداقل یک حرف');

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[0-9]/.test(value) && /[A-Za-z؀-ۿ]/.test(value)) score += 1;
  if (/[^A-Za-z0-9؀-ۿ]/.test(value)) score += 1;
  if (hints.length > 0) score = Math.min(score, 1);

  const label =
    ['بسیار ضعیف', 'ضعیف', 'متوسط', 'خوب', 'عالی'][score] ?? 'بسیار ضعیف';

  return { score, label, hints };
}
