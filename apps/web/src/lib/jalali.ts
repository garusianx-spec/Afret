import {
  format as formatJalali,
  startOfDay as startOfJalaliDay,
  isSameDay as isSameJalaliDay,
} from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

import { toFaDigits } from './persian';

/** `۲۶ شهریور ۱۴۰۴` */
export function jalaliLong(date: Date | number | string): string {
  return toFaDigits(formatJalali(new Date(date), 'd MMMM yyyy', { locale: faIR }));
}

/** `۲۶ شهریور` — used inside chat date separators. */
export function jalaliShort(date: Date | number | string): string {
  return toFaDigits(formatJalali(new Date(date), 'd MMMM', { locale: faIR }));
}

/** `چهارشنبه ۲۶ شهریور` */
export function jalaliWithWeekday(date: Date | number | string): string {
  return toFaDigits(
    formatJalali(new Date(date), 'EEEE d MMMM', { locale: faIR }),
  );
}

/** `۱۴۰۴/۰۶/۲۶` */
export function jalaliNumeric(date: Date | number | string): string {
  return toFaDigits(formatJalali(new Date(date), 'yyyy/MM/dd'));
}

/**
 * Human label for a chat date separator: today / yesterday / full date.
 * Grouping is done on the *Jalali* day boundary, not the UTC one.
 */
export function chatDayLabel(date: Date | number | string): string {
  const d = new Date(date);
  const now = new Date();
  if (isSameJalaliDay(d, now)) return 'امروز';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameJalaliDay(d, yesterday)) return 'دیروز';

  const withinWeek = now.getTime() - d.getTime() < 7 * 86_400_000;
  return withinWeek ? jalaliWithWeekday(d) : jalaliLong(d);
}

/** Stable key for grouping messages into day buckets. */
export function jalaliDayKey(date: Date | number | string): string {
  return formatJalali(startOfJalaliDay(new Date(date)), 'yyyy-MM-dd');
}

export { startOfJalaliDay, isSameJalaliDay };
