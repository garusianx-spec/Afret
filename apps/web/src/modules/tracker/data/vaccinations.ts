/**
 * Pediatric immunisation schedule, aligned with the Iranian national
 * programme (برنامه ایمن‌سازی کشوری). `ageMonths` is the recommended age;
 * the tracker turns it into a Jalali due date from the baby's birth date.
 */
export interface VaccineDose {
  id: string;
  name: string;
  ageMonths: number;
  /** Shown under the name — what the dose protects against. */
  protects: string;
  route: 'تزریقی' | 'خوراکی';
}

export const VACCINE_SCHEDULE: VaccineDose[] = [
  { id: 'bcg', name: 'ب‌ث‌ژ (BCG)', ageMonths: 0, protects: 'سل', route: 'تزریقی' },
  { id: 'hepb-0', name: 'هپاتیت ب — نوبت اول', ageMonths: 0, protects: 'هپاتیت ب', route: 'تزریقی' },
  { id: 'opv-0', name: 'فلج اطفال خوراکی — نوبت صفر', ageMonths: 0, protects: 'فلج اطفال', route: 'خوراکی' },
  { id: 'penta-1', name: 'پنتاوالان — نوبت اول', ageMonths: 2, protects: 'دیفتری، کزاز، سیاه‌سرفه، هپاتیت ب، هموفیلوس', route: 'تزریقی' },
  { id: 'opv-1', name: 'فلج اطفال — نوبت اول', ageMonths: 2, protects: 'فلج اطفال', route: 'خوراکی' },
  { id: 'penta-2', name: 'پنتاوالان — نوبت دوم', ageMonths: 4, protects: 'دیفتری، کزاز، سیاه‌سرفه، هپاتیت ب، هموفیلوس', route: 'تزریقی' },
  { id: 'opv-2', name: 'فلج اطفال — نوبت دوم', ageMonths: 4, protects: 'فلج اطفال', route: 'خوراکی' },
  { id: 'penta-3', name: 'پنتاوالان — نوبت سوم', ageMonths: 6, protects: 'دیفتری، کزاز، سیاه‌سرفه، هپاتیت ب، هموفیلوس', route: 'تزریقی' },
  { id: 'opv-3', name: 'فلج اطفال — نوبت سوم', ageMonths: 6, protects: 'فلج اطفال', route: 'خوراکی' },
  { id: 'mmr-1', name: 'ام‌ام‌آر — نوبت اول', ageMonths: 12, protects: 'سرخک، اوریون، سرخجه', route: 'تزریقی' },
  { id: 'mmr-2', name: 'ام‌ام‌آر — نوبت دوم', ageMonths: 18, protects: 'سرخک، اوریون، سرخجه', route: 'تزریقی' },
  { id: 'opv-4', name: 'فلج اطفال — یادآور اول', ageMonths: 18, protects: 'فلج اطفال', route: 'خوراکی' },
  { id: 'dtp-booster', name: 'سه‌گانه — یادآور', ageMonths: 18, protects: 'دیفتری، کزاز، سیاه‌سرفه', route: 'تزریقی' },
];

/** Developmental milestones — «آیا نوزاد من در مسیر است؟» */
export interface Milestone {
  id: string;
  ageMonths: number;
  title: string;
  /** Escalation guidance; deliberately phrased as "ask your doctor". */
  concernIfMissingByMonths: number;
}

export const MILESTONES: Milestone[] = [
  { id: 'social-smile', ageMonths: 2, title: 'لبخند اجتماعی', concernIfMissingByMonths: 3 },
  { id: 'head-control', ageMonths: 4, title: 'کنترل سر در حالت نشسته', concernIfMissingByMonths: 5 },
  { id: 'roll-over', ageMonths: 5, title: 'غلت زدن', concernIfMissingByMonths: 7 },
  { id: 'sit-unsupported', ageMonths: 7, title: 'نشستن بدون کمک', concernIfMissingByMonths: 9 },
  { id: 'first-tooth', ageMonths: 7, title: 'رویش اولین دندان', concernIfMissingByMonths: 14 },
  { id: 'crawl', ageMonths: 9, title: 'چهار دست و پا رفتن', concernIfMissingByMonths: 12 },
  { id: 'stand-support', ageMonths: 10, title: 'ایستادن با تکیه‌گاه', concernIfMissingByMonths: 13 },
  { id: 'first-word', ageMonths: 12, title: 'اولین کلمهٔ معنادار', concernIfMissingByMonths: 16 },
  { id: 'walk', ageMonths: 13, title: 'راه رفتن مستقل', concernIfMissingByMonths: 18 },
  { id: 'two-words', ageMonths: 20, title: 'ترکیب دو کلمه', concernIfMissingByMonths: 26 },
];
