/**
 * Persian (fa-IR) formatting helpers.
 *
 * Everything user-facing goes through this module so digits, separators and
 * units stay consistent across the app — including inside the service worker
 * notification payloads, which cannot import React-land code.
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;
const AR_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/** Convert every ASCII / Arabic-Indic digit in a string to Persian digits. */
export function toFaDigits(input: string | number): string {
  return String(input)
    .replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
    .replace(/[٠-٩]/g, (d) => FA_DIGITS[AR_INDIC.indexOf(d as (typeof AR_INDIC)[number])]);
}

/** Convert Persian / Arabic-Indic digits back to ASCII — for form parsing. */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d as (typeof FA_DIGITS)[number])))
    .replace(/[٠-٩]/g, (d) => String(AR_INDIC.indexOf(d as (typeof AR_INDIC)[number])));
}

/** Locale-aware number with Persian digits and thousands separators. */
export function formatFa(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat('fa-IR', options).format(value);
}

/** e.g. `۲٫۵ کیلوگرم` */
export function formatFaUnit(
  value: number,
  unit: string,
  fractionDigits = 1,
): string {
  const n = formatFa(value, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${n} ${unit}`;
}

/** Clock time for chat bubbles: `۱۴:۰۳`. */
export function formatFaTime(date: Date | number | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Relative phrasing used by chat previews and log lists.
 * Intl.RelativeTimeFormat already yields Persian digits for fa-IR.
 */
export function formatFaRelative(date: Date | number | string): string {
  const then = new Date(date).getTime();
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat('fa-IR', { numeric: 'auto' });
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 2_592_000) return rtf.format(Math.round(diffSec / 86_400), 'day');
  return rtf.format(Math.round(diffSec / 2_592_000), 'month');
}

/** `۱۲ هفته و ۳ روز` — the canonical way Afrat states gestational age. */
export function formatGestational(weeks: number, days: number): string {
  if (days === 0) return `${toFaDigits(weeks)} هفته`;
  return `${toFaDigits(weeks)} هفته و ${toFaDigits(days)} روز`;
}

/** `۱ سال و ۲ ماه` / `۴ ماهه` — baby age phrasing. */
export function formatBabyAge(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${toFaDigits(months)} ماهه`;
  if (months === 0) return `${toFaDigits(years)} ساله`;
  return `${toFaDigits(years)} سال و ${toFaDigits(months)} ماه`;
}
