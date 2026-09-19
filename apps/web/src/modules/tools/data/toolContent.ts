import type { ChecklistTemplateItem } from '@/modules/profile/data/checklists';

/** Mode B — checklist of medical checks before trying to conceive. */
export const PRECONCEPTION_CHECKLIST: ChecklistTemplateItem[] = [
  { id: 'bloodwork', label: 'آزمایش خون کامل و آهن', group: 'آزمایش‌ها', essential: true },
  { id: 'thyroid', label: 'آزمایش تیروئید (TSH)', group: 'آزمایش‌ها', essential: true },
  { id: 'rubella', label: 'بررسی ایمنی سرخجه', group: 'آزمایش‌ها', essential: true },
  { id: 'vitd', label: 'ویتامین D', group: 'آزمایش‌ها' },
  { id: 'pap', label: 'تست پاپ‌اسمیر (در صورت نیاز)', group: 'آزمایش‌ها' },
  { id: 'dental', label: 'معاینهٔ دندان‌پزشکی', group: 'چکاپ' },
  { id: 'weight', label: 'بررسی وزن و BMI', group: 'چکاپ' },
  { id: 'partner', label: 'آزمایش اسپرم همسر', group: 'چکاپ' },
  { id: 'folic-start', label: 'شروع اسید فولیک', group: 'آمادگی', essential: true },
  { id: 'vaccines', label: 'به‌روز بودن واکسن‌ها', group: 'آمادگی' },
];

/** Mode D — screen-free sensory play ideas, by rough age band. */
export interface PlayIdea {
  id: string;
  label: string;
  ageRange: string;
}

export const SCREEN_FREE_PLAY_IDEAS: PlayIdea[] = [
  { id: 'tummy-mirror', label: 'زمان روی شکم مقابل آینه', ageRange: '۰ تا ۳ ماه' },
  { id: 'texture-cards', label: 'لمس کارت‌های با بافت‌های مختلف', ageRange: '۳ تا ۶ ماه' },
  { id: 'rattle-sounds', label: 'کاوش با جغجغه و اشیای صداده', ageRange: '۳ تا ۶ ماه' },
  { id: 'peekaboo', label: 'بازی دالی‌موشه (پیدا شدن و پنهان شدن)', ageRange: '۶ تا ۹ ماه' },
  { id: 'stacking-cups', label: 'روی‌هم‌چینی لیوان‌ها یا بلوک‌ها', ageRange: '۹ تا ۱۲ ماه' },
  { id: 'water-play', label: 'بازی با آب در ظرف کم‌عمق (زیر نظر کامل)', ageRange: '۹ تا ۱۲ ماه' },
  { id: 'sorting', label: 'دسته‌بندی اشیا بر اساس رنگ یا اندازه', ageRange: '۱۲ تا ۱۸ ماه' },
  { id: 'pretend-kitchen', label: 'آشپزخانهٔ خیالی با ظروف واقعی', ageRange: '۱۸ تا ۲۴ ماه' },
  { id: 'outdoor-nature', label: 'جمع‌آوری برگ و سنگ در حیاط', ageRange: '۱۸ تا ۲۴ ماه' },
  { id: 'drawing', label: 'خط‌خطی با مداد شمعی بزرگ', ageRange: '۱۸ تا ۲۴ ماه' },
];

/** Mode D — common first foods, for the allergy/introduction tracker. */
export const COMMON_FIRST_FOODS = [
  'برنج', 'سیب‌زمینی', 'هویج', 'موز', 'سیب', 'آووکادو',
  'تخم‌مرغ (زرده)', 'مرغ', 'عدس', 'ماست', 'بادام‌زمینی (پودر رقیق)', 'گندم',
] as const;

/** Reaction severity for a newly introduced food. */
export const REACTION_LEVELS = [
  { value: 0, label: 'بدون واکنش', tone: 'mint' as const },
  { value: 1, label: 'واکنش خفیف (بثورات جزئی)', tone: 'coral' as const },
  { value: 2, label: 'واکنش نگران‌کننده', tone: 'coral' as const },
];

/** Mode A — short self-care / women's-health articles. */
export interface Article {
  id: string;
  title: string;
  body: string;
}

export const SELF_CARE_ARTICLES: Article[] = [
  {
    id: 'cramps',
    title: 'چرا دردهای قاعدگی رخ می‌دهند؟',
    body: 'انقباض رحم برای دفع بافت داخلی، هورمون پروستاگلاندین ترشح می‌کند که عامل اصلی درد است. گرمای موضعی، ورزش سبک و منیزیم می‌توانند شدت درد را کاهش دهند. اگر درد آن‌قدر شدید است که در فعالیت روزمره اختلال ایجاد می‌کند، حتماً با پزشک مشورت کنید.',
  },
  {
    id: 'cycle-length',
    title: 'چرخهٔ نامنظم چه زمانی نگران‌کننده است؟',
    body: 'چرخه‌های ۲۱ تا ۳۵ روزه معمولاً طبیعی‌اند. تغییرات مکرر بیش از ۷ روز، قطع قاعدگی بیش از سه ماه، یا خونریزی بسیار شدید دلایلی برای مراجعه به پزشک هستند.',
  },
  {
    id: 'iron',
    title: 'کم‌خونی و قاعدگی',
    body: 'خونریزی قاعدگی سنگین می‌تواند منجر به کمبود آهن شود. گوشت قرمز، عدس، اسفناج و خرما را در برنامهٔ غذایی این هفته بگنجانید و در صورت خستگی مفرط آزمایش آهن بدهید.',
  },
  {
    id: 'self-care',
    title: 'خودمراقبتی در فاز لوتئال',
    body: 'کاهش کافئین و نمک، خواب منظم، و کاهش استرس می‌توانند علائم پیش از قاعدگی (PMS) را ملایم‌تر کنند. اگر نوسانات خلقی زندگی روزمره را مختل می‌کند، این را با پزشک خود مطرح کنید.',
  },
];

/** Mode B — fertility-supportive diet ideas for both partners. */
export const FERTILITY_DIET_TIPS = [
  'اسیدهای چرب امگا-۳ (ماهی سالمون، گردو) به تعادل هورمونی کمک می‌کنند.',
  'آنتی‌اکسیدان‌های میوه و سبزی رنگی کیفیت تخمک و اسپرم را بهبود می‌بخشند.',
  'غلات کامل به‌جای فرآوری‌شده، حساسیت به انسولین را بهتر می‌کند.',
  'روی (زینک) در گوشت قرمز و حبوبات برای اسپرم‌سازی مهم است.',
  'مصرف قند و چربی ترانس را برای هر دو نفر محدود کنید.',
];

/**
 * Mode C — general cord-blood-banking screening criteria. These are the
 * commonly published categories every bank checks, not one specific
 * provider's protocol — the exact cut-offs differ by lab, which is why
 * every item says to confirm with the chosen bank rather than stating a
 * number as universal.
 */
export const CORD_BLOOD_ELIGIBILITY: ChecklistTemplateItem[] = [
  {
    id: 'gestation',
    label: 'سن بارداری معمولاً ۳۴ هفته یا بیشتر (بسته به بانک)',
    group: 'معیارهای عمومی پذیرش',
    essential: true,
  },
  { id: 'singleton', label: 'بارداری تک‌قلو (دوقلویی را با بانک هماهنگ کنید)', group: 'معیارهای عمومی پذیرش' },
  { id: 'consent-timing', label: 'ثبت‌نام و رضایت‌نامه پیش از هفتهٔ ۳۴–۳۶', group: 'معیارهای عمومی پذیرش', essential: true },
  { id: 'kit-ready', label: 'کیت جمع‌آوری همراه شما در روز زایمان', group: 'معیارهای عمومی پذیرش' },
];

export const CORD_BLOOD_CONTRAINDICATIONS: ChecklistTemplateItem[] = [
  { id: 'infection', label: 'عفونت فعال یا تب در زمان زایمان', group: 'شرایط محدودکننده', essential: true },
  {
    id: 'blood-borne',
    label: 'سابقهٔ HIV، هپاتیت B/C یا سیفلیس تأییدشده در مادر',
    group: 'شرایط محدودکننده',
    essential: true,
  },
  { id: 'chorio', label: 'کوریوآمنیونیت (عفونت پردهٔ جنینی)', group: 'شرایط محدودکننده' },
  {
    id: 'live-vaccine',
    label: 'دریافت واکسن زنده (مثل سرخک-اوریون-سرخجه) در چند هفتهٔ اخیر',
    group: 'شرایط محدودکننده',
  },
  { id: 'iv-drug', label: 'سابقهٔ مصرف تزریقی مواد مخدر', group: 'شرایط محدودکننده' },
];
