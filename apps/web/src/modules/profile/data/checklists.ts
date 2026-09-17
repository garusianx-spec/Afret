export interface ChecklistTemplateItem {
  id: string;
  label: string;
  /** Grouping header inside the checklist. */
  group: string;
  essential?: boolean;
}

/** ساک زایمان — hospital bag. */
export const HOSPITAL_BAG: ChecklistTemplateItem[] = [
  { id: 'id-docs', label: 'شناسنامه، کارت ملی و دفترچهٔ بیمه', group: 'مدارک', essential: true },
  { id: 'file', label: 'پروندهٔ بارداری و آزمایش‌ها', group: 'مدارک', essential: true },
  { id: 'sonography', label: 'آخرین سونوگرافی', group: 'مدارک' },
  { id: 'gown', label: 'لباس راحت و جلوباز برای شیردهی', group: 'مادر', essential: true },
  { id: 'pads', label: 'نوار بهداشتی بعد از زایمان', group: 'مادر', essential: true },
  { id: 'slippers', label: 'دمپایی و حوله', group: 'مادر' },
  { id: 'nipple-cream', label: 'پماد نوک سینه', group: 'مادر' },
  { id: 'toiletries', label: 'لوازم بهداشتی شخصی', group: 'مادر' },
  { id: 'baby-clothes', label: 'لباس نوزاد (۳ دست)', group: 'نوزاد', essential: true },
  { id: 'swaddle', label: 'قنداق و پتوی نرم', group: 'نوزاد', essential: true },
  { id: 'diapers', label: 'پوشک نوزاد', group: 'نوزاد', essential: true },
  { id: 'wet-wipes', label: 'دستمال مرطوب بدون الکل', group: 'نوزاد' },
  { id: 'car-seat', label: 'صندلی خودرو برای بازگشت', group: 'نوزاد' },
  { id: 'charger', label: 'شارژر و پاوربانک', group: 'متفرقه', essential: true },
  { id: 'snacks', label: 'خوراکی سبک و آب', group: 'متفرقه' },
];

/** سیسمونی — baby layette planner. */
export const LAYETTE: ChecklistTemplateItem[] = [
  { id: 'crib', label: 'تخت یا گهواره', group: 'خواب', essential: true },
  { id: 'mattress', label: 'تشک سفت و ملحفهٔ ضدحساسیت', group: 'خواب', essential: true },
  { id: 'sleep-bag', label: 'کیسه خواب نوزاد', group: 'خواب' },
  { id: 'bodysuit', label: 'بادی آستین‌بلند (۶ عدد)', group: 'پوشاک', essential: true },
  { id: 'sleepsuit', label: 'سرهمی (۴ عدد)', group: 'پوشاک', essential: true },
  { id: 'hat-socks', label: 'کلاه و جوراب', group: 'پوشاک' },
  { id: 'bathtub', label: 'وان حمام نوزاد', group: 'بهداشت', essential: true },
  { id: 'baby-wash', label: 'شامپو و شویندهٔ ملایم', group: 'بهداشت' },
  { id: 'thermometer', label: 'دماسنج دیجیتال', group: 'بهداشت', essential: true },
  { id: 'nail-clipper', label: 'ناخن‌گیر نوزاد', group: 'بهداشت' },
  { id: 'bottle', label: 'شیشهٔ شیر و برس مخصوص', group: 'تغذیه' },
  { id: 'breast-pump', label: 'شیردوش', group: 'تغذیه' },
  { id: 'bib', label: 'پیش‌بند', group: 'تغذیه' },
  { id: 'stroller', label: 'کالسکه', group: 'حمل‌ونقل', essential: true },
  { id: 'carrier', label: 'آغوشی', group: 'حمل‌ونقل' },
  { id: 'diaper-bag', label: 'کیف لوازم نوزاد', group: 'حمل‌ونقل' },
];

export interface SoundTrack {
  id: string;
  title: string;
  /** Path under `public/audio/`; see the README there. */
  src: string;
  category: 'نویز سفید' | 'لالایی' | 'صدای طبیعت';
}

export const SOUND_LIBRARY: SoundTrack[] = [
  { id: 'white', title: 'نویز سفید ملایم', src: '/audio/white-noise.mp3', category: 'نویز سفید' },
  { id: 'pink', title: 'نویز صورتی', src: '/audio/pink-noise.mp3', category: 'نویز سفید' },
  { id: 'heartbeat', title: 'ضربان قلب مادر', src: '/audio/heartbeat.mp3', category: 'نویز سفید' },
  { id: 'rain', title: 'صدای باران', src: '/audio/rain.mp3', category: 'صدای طبیعت' },
  { id: 'waves', title: 'موج دریا', src: '/audio/waves.mp3', category: 'صدای طبیعت' },
  { id: 'lullaby-fa', title: 'لالایی لری', src: '/audio/lullaby-lori.mp3', category: 'لالایی' },
  { id: 'lullaby-classic', title: 'لالایی کلاسیک', src: '/audio/lullaby-classic.mp3', category: 'لالایی' },
];
