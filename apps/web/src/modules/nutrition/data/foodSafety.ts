import type { FoodSafetyEntry } from '../types';

/**
 * Pregnancy food-safety reference.
 *
 * Deliberately conservative and non-exhaustive: the search UI always falls
 * back to «با پزشک خود مشورت کنید» rather than guessing. Entries reflect
 * mainstream prenatal guidance (listeria, methylmercury, toxoplasma risk) and
 * cover foods common in Iranian households.
 */
export const FOOD_SAFETY: FoodSafetyEntry[] = [
  {
    id: 'soft-cheese',
    name: 'پنیر نرم غیرپاستوریزه',
    aliases: ['پنیر محلی', 'پنیر تازه', 'پنیر لیقوان خام'],
    category: 'لبنیات',
    verdict: 'avoid',
    reason: 'خطر آلودگی به لیستریا که می‌تواند باعث سقط یا زایمان زودرس شود.',
  },
  {
    id: 'pasteurized-cheese',
    name: 'پنیر پاستوریزه',
    aliases: ['پنیر صبحانه', 'پنیر بسته‌بندی'],
    category: 'لبنیات',
    verdict: 'safe',
    reason: 'پاستوریزاسیون لیستریا را از بین می‌برد؛ منبع خوب کلسیم است.',
  },
  {
    id: 'raw-egg',
    name: 'تخم‌مرغ خام یا نیم‌پز',
    aliases: ['نیمرو عسلی', 'سس مایونز خانگی', 'تخم‌مرغ عسلی'],
    category: 'پروتئین',
    verdict: 'avoid',
    reason: 'خطر سالمونلا. زردهٔ تخم‌مرغ باید کاملاً سفت شود.',
  },
  {
    id: 'tuna',
    name: 'تن ماهی',
    aliases: ['ماهی تن', 'کنسرو تن'],
    category: 'دریایی',
    verdict: 'caution',
    reason: 'حاوی جیوه است؛ مصرف زیاد بر رشد مغز جنین اثر می‌گذارد.',
    limit: 'حداکثر ۲ وعدهٔ ۱۰۰ گرمی در هفته',
  },
  {
    id: 'salmon',
    name: 'ماهی سالمون',
    aliases: ['سالمون', 'ماهی آزاد'],
    category: 'دریایی',
    verdict: 'safe',
    reason: 'جیوهٔ پایین و امگا-۳ بالا؛ برای رشد مغز جنین مفید است.',
    limit: 'کاملاً پخته مصرف شود',
  },
  {
    id: 'shark',
    name: 'کوسه و شمشیرماهی',
    aliases: ['اره‌ماهی', 'شمشیر ماهی'],
    category: 'دریایی',
    verdict: 'avoid',
    reason: 'بالاترین سطح متیل‌جیوه در میان ماهی‌های خوراکی.',
  },
  {
    id: 'sushi',
    name: 'سوشی با ماهی خام',
    aliases: ['ماهی خام', 'ساشیمی'],
    category: 'دریایی',
    verdict: 'avoid',
    reason: 'ماهی خام ممکن است حاوی انگل و لیستریا باشد.',
  },
  {
    id: 'deli-meat',
    name: 'کالباس و سوسیس',
    aliases: ['ژامبون', 'فرآورده گوشتی'],
    category: 'پروتئین',
    verdict: 'caution',
    reason: 'خطر لیستریا در فرآورده‌های سرد؛ نیترات نیز بالاست.',
    limit: 'فقط در صورت حرارت دادن کامل تا بخار شدن',
  },
  {
    id: 'liver',
    name: 'جگر',
    aliases: ['جگر گوساله', 'جگر مرغ'],
    category: 'پروتئین',
    verdict: 'caution',
    reason: 'ویتامین A بسیار بالا که در دوز زیاد برای جنین سمی است.',
    limit: 'حداکثر یک وعدهٔ کوچک در دو هفته',
  },
  {
    id: 'coffee',
    name: 'قهوه',
    aliases: ['اسپرسو', 'کافئین', 'نسکافه'],
    category: 'نوشیدنی',
    verdict: 'caution',
    reason: 'کافئین از جفت عبور می‌کند؛ مصرف زیاد با کاهش وزن تولد مرتبط است.',
    limit: 'حداکثر ۲۰۰ میلی‌گرم کافئین در روز (حدود یک فنجان)',
  },
  {
    id: 'herbal-tea',
    name: 'دمنوش‌های گیاهی',
    aliases: ['چای گیاهی', 'دمنوش'],
    category: 'نوشیدنی',
    verdict: 'caution',
    reason: 'برخی گیاهان مانند مریم‌گلی و شنبلیله محرک انقباض رحم‌اند.',
    limit: 'قبل از مصرف منظم با پزشک مشورت کنید',
  },
  {
    id: 'alcohol',
    name: 'الکل',
    aliases: ['مشروب', 'نوشیدنی الکلی'],
    category: 'نوشیدنی',
    verdict: 'avoid',
    reason: 'هیچ مقدار ایمنی ندارد؛ باعث سندرم الکل جنینی می‌شود.',
  },
  {
    id: 'unwashed-produce',
    name: 'سبزی و میوهٔ شسته‌نشده',
    aliases: ['سبزی خام', 'سالاد آماده'],
    category: 'میوه و سبزی',
    verdict: 'caution',
    reason: 'خطر توکسوپلاسموز از خاک باقی‌مانده روی محصول.',
    limit: 'با محلول ضدعفونی‌کننده کاملاً شسته شود',
  },
  {
    id: 'dates',
    name: 'خرما',
    aliases: ['رطب', 'خرمای مضافتی'],
    category: 'میوه و سبزی',
    verdict: 'safe',
    reason: 'منبع آهن و فیبر؛ در هفته‌های پایانی به آمادگی دهانهٔ رحم کمک می‌کند.',
    limit: 'در دیابت بارداری مقدار را با پزشک تنظیم کنید',
  },
  {
    id: 'saffron',
    name: 'زعفران',
    aliases: ['زعفرون'],
    category: 'چاشنی',
    verdict: 'caution',
    reason: 'در مقدار زیاد محرک انقباض رحم است.',
    limit: 'مقدار آشپزی معمول بی‌خطر است؛ از مکمل زعفران پرهیز کنید',
  },
  {
    id: 'pasteurized-milk',
    name: 'شیر پاستوریزه',
    aliases: ['شیر', 'شیر کم‌چرب'],
    category: 'لبنیات',
    verdict: 'safe',
    reason: 'منبع اصلی کلسیم و ویتامین D در بارداری.',
  },
  {
    id: 'raw-milk',
    name: 'شیر خام',
    aliases: ['شیر محلی', 'شیر تازه دوشیده'],
    category: 'لبنیات',
    verdict: 'avoid',
    reason: 'خطر بروسلوز و لیستریا.',
  },
  {
    id: 'honey',
    name: 'عسل',
    aliases: ['انگبین'],
    category: 'شیرین‌کننده',
    verdict: 'safe',
    reason: 'برای مادر بی‌خطر است؛ اما تا یک‌سالگی به نوزاد داده نشود.',
  },
];

export const FOOD_CATEGORIES = Array.from(
  new Set(FOOD_SAFETY.map((entry) => entry.category)),
);
