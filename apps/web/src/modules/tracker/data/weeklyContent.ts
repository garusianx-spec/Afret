/**
 * Week-by-week pregnancy content.
 *
 * Editorial content only — it is deliberately non-diagnostic. Anything that
 * could steer a clinical decision must come from the consultation module, not
 * from here. Sourced from public maternal-health education material and
 * reviewed against the Iranian Ministry of Health prenatal care booklet.
 */
export interface WeeklyEntry {
  week: number;
  /** «اندازهٔ جنین شبیه…» — the familiar fruit comparison. */
  size: string;
  lengthCm?: number;
  weightG?: number;
  /** The daily micro-tip written in the fetus's voice («پیام روز»). */
  babyVoice: string;
  development: string;
  motherNote: string;
  /** Focus nutrients for this week. */
  nutrients: string[];
}

export const WEEKLY_CONTENT: WeeklyEntry[] = [
  {
    week: 4,
    size: 'دانهٔ خشخاش',
    lengthCm: 0.1,
    babyVoice: 'تازه رسیدم! هنوز خیلی کوچکم، اما قلبم دارد شکل می‌گیرد.',
    development: 'لولهٔ عصبی در حال بسته شدن است و جفت شروع به شکل‌گیری می‌کند.',
    motherNote: 'ممکن است هنوز نشانه‌ای حس نکنید. مصرف اسید فولیک را جدی بگیرید.',
    nutrients: ['اسید فولیک', 'ید'],
  },
  {
    week: 6,
    size: 'دانهٔ عدس',
    lengthCm: 0.5,
    babyVoice: 'قلبم شروع به تپیدن کرده — حدود ۱۱۰ بار در دقیقه!',
    development: 'ضربان قلب در سونوگرافی قابل تشخیص است؛ جوانهٔ دست و پا پیدا شده.',
    motherNote: 'تهوع صبحگاهی شایع است. وعده‌های کوچک و مکرر کمک می‌کند.',
    nutrients: ['ویتامین B6', 'اسید فولیک', 'مایعات'],
  },
  {
    week: 8,
    size: 'تمشک',
    lengthCm: 1.6,
    weightG: 1,
    babyVoice: 'انگشت‌هایم دارند از هم جدا می‌شوند.',
    development: 'اندام‌های اصلی شکل گرفته‌اند؛ حرکات خودبه‌خودی آغاز شده است.',
    motherNote: 'اولین ویزیت مراقبت بارداری را در این بازه هماهنگ کنید.',
    nutrients: ['اسید فولیک', 'پروتئین', 'آهن'],
  },
  {
    week: 12,
    size: 'لیموترش',
    lengthCm: 5.4,
    weightG: 14,
    babyVoice: 'می‌توانم انگشت شستم را بمکم و صورتم کامل شده است.',
    development: 'پایان سه‌ماههٔ اول؛ رفلکس‌ها شکل گرفته و کلیه‌ها کار می‌کنند.',
    motherNote: 'زمان غربالگری سه‌ماههٔ اول و سونوگرافی NT است.',
    nutrients: ['کلسیم', 'آهن', 'ویتامین D'],
  },
  {
    week: 16,
    size: 'آووکادو',
    lengthCm: 11.6,
    weightG: 100,
    babyVoice: 'صدای قلب شما را می‌شنوم؛ آرام‌بخش‌ترین صدای دنیاست.',
    development: 'استخوان‌ها در حال سخت شدن‌اند و پوست هنوز شفاف است.',
    motherNote: 'انرژی معمولاً برمی‌گردد. پیاده‌روی سبک روزانه را شروع کنید.',
    nutrients: ['کلسیم', 'امگا-۳', 'پروتئین'],
  },
  {
    week: 20,
    size: 'موز',
    lengthCm: 25.6,
    weightG: 300,
    babyVoice: 'نیمهٔ راه را رد کردیم! امروز می‌توانید مرا در سونوگرافی ببینید.',
    development: 'سونوگرافی آنومالی؛ حرکات جنین برای اغلب مادران محسوس می‌شود.',
    motherNote: 'سونوگرافی غربالگری ساختاری را از قلم نیندازید.',
    nutrients: ['آهن', 'ویتامین D', 'فیبر'],
  },
  {
    week: 24,
    size: 'بلال ذرت',
    lengthCm: 30,
    weightG: 600,
    babyVoice: 'ریه‌هایم دارند تمرین نفس کشیدن می‌کنند.',
    development: 'آستانهٔ زنده‌مانی؛ شنوایی به‌خوبی شکل گرفته است.',
    motherNote: 'زمان تست تحمل گلوکز (غربالگری دیابت بارداری) است.',
    nutrients: ['آهن', 'منیزیم', 'پروتئین'],
  },
  {
    week: 28,
    size: 'بادمجان',
    lengthCm: 37.6,
    weightG: 1000,
    babyVoice: 'چشم‌هایم را باز و بسته می‌کنم و به نور واکنش نشان می‌دهم.',
    development: 'شروع سه‌ماههٔ سوم؛ چربی زیرپوستی در حال ذخیره شدن است.',
    motherNote: 'شمارش حرکات جنین را روزانه ثبت کنید.',
    nutrients: ['آهن', 'کولین', 'امگا-۳'],
  },
  {
    week: 32,
    size: 'نارگیل',
    lengthCm: 42.4,
    weightG: 1700,
    babyVoice: 'دارم برای روز تولد جا باز می‌کنم — کمی تنگ شده اینجا!',
    development: 'ناخن‌ها کامل شده و جنین معمولاً رو به پایین می‌چرخد.',
    motherNote: 'سوزش سر دل شایع است؛ وعده‌های سبک‌تر و زودتر شام بخورید.',
    nutrients: ['کلسیم', 'ویتامین K', 'پروتئین'],
  },
  {
    week: 36,
    size: 'کاهو',
    lengthCm: 47.4,
    weightG: 2600,
    babyVoice: 'تقریباً آماده‌ام. ساکم را ببندید!',
    development: 'ریه‌ها تقریباً بالغ‌اند؛ جنین در لگن پایین می‌آید.',
    motherNote: 'چک‌لیست ساک زایمان را نهایی کنید و علائم زایمان را مرور کنید.',
    nutrients: ['آهن', 'ویتامین C', 'مایعات'],
  },
  {
    week: 40,
    size: 'هندوانهٔ کوچک',
    lengthCm: 51.2,
    weightG: 3400,
    babyVoice: 'هر لحظه ممکن است همدیگر را ببینیم. دوستت دارم مامان.',
    development: 'رشد کامل؛ زایمان از این هفته تا هفتهٔ ۴۲ طبیعی است.',
    motherNote: 'کاهش محسوس حرکات جنین را فوراً به پزشک اطلاع دهید.',
    nutrients: ['مایعات', 'کربوهیدرات پیچیده', 'آهن'],
  },
];

/** Nearest authored entry at or before `week`. */
export function weeklyEntryFor(week: number): WeeklyEntry {
  const sorted = [...WEEKLY_CONTENT].sort((a, b) => a.week - b.week);
  let match = sorted[0];
  for (const entry of sorted) {
    if (entry.week <= week) match = entry;
    else break;
  }
  return match;
}
