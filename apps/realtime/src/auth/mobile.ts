import { toEnDigits } from './digits.js';

/**
 * Iranian mobile numbers.
 *
 * Accepted on input (users type all of these):
 *   09123456789      national form
 *   +989123456789    E.164
 *   00989123456789   international prefix
 *   9123456789       leading zero dropped
 *   ۰۹۱۲۳۴۵۶۷۸۹      Persian digits
 *   0912 345 6789    spaces / dashes
 *
 * Stored canonically as `+989XXXXXXXXX`, because a phone number is an identity
 * key: if the same person can register twice under two spellings, every
 * uniqueness guarantee downstream is void.
 */
const CANONICAL = /^\+989\d{9}$/;

export function normalizeMobile(input: string): string | null {
  if (!input) return null;

  // Persian/Arabic digits first, then strip formatting noise.
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

/** `+989123456789` → `۰۹۱۲***۶۷۸۹`, for display in OTP screens and logs. */
export function maskMobile(canonical: string): string {
  const national = `0${canonical.slice(3)}`;
  return `${national.slice(0, 4)}***${national.slice(-4)}`;
}

/** `+989123456789` → `09123456789`, the form Iranian SMS gateways expect. */
export function toNationalMobile(canonical: string): string {
  return `0${canonical.slice(3)}`;
}
