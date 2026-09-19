export type NameGender = 'boy' | 'girl' | 'unisex';

export type NameOrigin = 'باستانی' | 'اوستایی' | 'شاهنامه‌ای' | 'نوین';

export interface BabyName {
  id: string;
  name: string;
  /** Latin transliteration — Persian script often omits short vowels. */
  pronunciation: string;
  gender: NameGender;
  origin: NameOrigin;
  meaning: string;
  /**
   * A rough 1–5 editorial "how common is this today" indicator, not an
   * official civil-registry statistic — there is no such data source wired
   * into this app.
   */
  popularity: 1 | 2 | 3 | 4 | 5;
}

// prettier-ignore
export const BABY_NAMES: BabyName[] = [
  { id: 'arash', name: 'آرش', pronunciation: 'Arash', gender: 'boy', origin: 'شاهنامه‌ای', meaning: 'نام پهلوان اسطوره‌ای تیرانداز ایران', popularity: 4 },
  { id: 'kourosh', name: 'کوروش', pronunciation: 'Kourosh', gender: 'boy', origin: 'باستانی', meaning: 'مانند خورشید، برگرفته از نام کوروش بزرگ', popularity: 4 },
  { id: 'dariush', name: 'داریوش', pronunciation: 'Dariush', gender: 'boy', origin: 'باستانی', meaning: 'دارندهٔ نیکی', popularity: 3 },
  { id: 'bahram', name: 'بهرام', pronunciation: 'Bahram', gender: 'boy', origin: 'اوستایی', meaning: 'پیروزی؛ نام ایزد پیروزی در آیین زرتشتی', popularity: 3 },
  { id: 'sohrab', name: 'سهراب', pronunciation: 'Sohrab', gender: 'boy', origin: 'شاهنامه‌ای', meaning: 'دارای درخشش سرخ‌فام؛ فرزند رستم در شاهنامه', popularity: 3 },
  { id: 'rostam', name: 'رستم', pronunciation: 'Rostam', gender: 'boy', origin: 'شاهنامه‌ای', meaning: 'نام پهلوان بزرگ شاهنامه', popularity: 2 },
  { id: 'arman', name: 'آرمان', pronunciation: 'Arman', gender: 'boy', origin: 'نوین', meaning: 'آرزو، ایده‌آل', popularity: 5 },
  { id: 'aria', name: 'آریا', pronunciation: 'Aria', gender: 'unisex', origin: 'باستانی', meaning: 'نجیب، آزاده', popularity: 5 },
  { id: 'kian', name: 'کیان', pronunciation: 'Kian', gender: 'boy', origin: 'نوین', meaning: 'پادشاهان؛ بنیاد و اساس', popularity: 5 },
  { id: 'parsa', name: 'پارسا', pronunciation: 'Parsa', gender: 'unisex', origin: 'نوین', meaning: 'پرهیزگار، پاکدامن', popularity: 4 },
  { id: 'saman', name: 'سامان', pronunciation: 'Saman', gender: 'boy', origin: 'نوین', meaning: 'نظم، سروسامان', popularity: 3 },
  { id: 'ilia', name: 'ایلیا', pronunciation: 'Ilia', gender: 'boy', origin: 'نوین', meaning: 'نامی رایج با ریشهٔ کهن خاورمیانه‌ای', popularity: 4 },
  { id: 'alvand', name: 'الوند', pronunciation: 'Alvand', gender: 'boy', origin: 'باستانی', meaning: 'نام کوهی در همدان؛ نماد استواری', popularity: 2 },
  { id: 'shayan', name: 'شایان', pronunciation: 'Shayan', gender: 'boy', origin: 'نوین', meaning: 'شایسته، درخور', popularity: 3 },
  { id: 'mehrdad', name: 'مهرداد', pronunciation: 'Mehrdad', gender: 'boy', origin: 'باستانی', meaning: 'داده‌شده از مهر (خورشید/دوستی)', popularity: 2 },
  { id: 'ardavan', name: 'اردوان', pronunciation: 'Ardavan', gender: 'boy', origin: 'باستانی', meaning: 'نگهبان راستی', popularity: 2 },
  { id: 'farhad', name: 'فرهاد', pronunciation: 'Farhad', gender: 'boy', origin: 'شاهنامه‌ای', meaning: 'دارای فر و شکوه', popularity: 2 },
  { id: 'hooman', name: 'هومن', pronunciation: 'Hooman', gender: 'boy', origin: 'اوستایی', meaning: 'دارای اندیشهٔ نیک', popularity: 3 },
  { id: 'radin', name: 'رادین', pronunciation: 'Radin', gender: 'boy', origin: 'نوین', meaning: 'بخشنده، جوانمرد', popularity: 4 },
  { id: 'artin', name: 'آرتین', pronunciation: 'Artin', gender: 'boy', origin: 'نوین', meaning: 'پاک‌نژاد', popularity: 4 },

  { id: 'sayeh', name: 'سایه', pronunciation: 'Sayeh', gender: 'girl', origin: 'نوین', meaning: 'سایه؛ آرامش و پناه', popularity: 3 },
  { id: 'setareh', name: 'ستاره', pronunciation: 'Setareh', gender: 'girl', origin: 'نوین', meaning: 'ستاره', popularity: 3 },
  { id: 'bahar', name: 'بهار', pronunciation: 'Bahar', gender: 'girl', origin: 'نوین', meaning: 'فصل بهار؛ نماد تازگی', popularity: 4 },
  { id: 'yasaman', name: 'یاسمن', pronunciation: 'Yasaman', gender: 'girl', origin: 'نوین', meaning: 'گل یاس', popularity: 4 },
  { id: 'niloofar', name: 'نیلوفر', pronunciation: 'Niloofar', gender: 'girl', origin: 'نوین', meaning: 'گل نیلوفر آبی', popularity: 3 },
  { id: 'shirin', name: 'شیرین', pronunciation: 'Shirin', gender: 'girl', origin: 'شاهنامه‌ای', meaning: 'شیرین؛ نام معشوقهٔ خسرو در ادبیات کهن', popularity: 3 },
  { id: 'anahita', name: 'آناهیتا', pronunciation: 'Anahita', gender: 'girl', origin: 'اوستایی', meaning: 'نام ایزدبانوی آب در آیین باستانی ایران', popularity: 3 },
  { id: 'roya', name: 'رویا', pronunciation: 'Roya', gender: 'girl', origin: 'نوین', meaning: 'رؤیا، خواب و خیال', popularity: 3 },
  { id: 'parnia', name: 'پرنیا', pronunciation: 'Parnia', gender: 'girl', origin: 'نوین', meaning: 'پری‌آسا، لطیف', popularity: 5 },
  { id: 'taraneh', name: 'ترانه', pronunciation: 'Taraneh', gender: 'girl', origin: 'نوین', meaning: 'آواز، سرود', popularity: 3 },
  { id: 'mahsa', name: 'مهسا', pronunciation: 'Mahsa', gender: 'girl', origin: 'نوین', meaning: 'مانند ماه', popularity: 4 },
  { id: 'dorsa', name: 'درسا', pronunciation: 'Dorsa', gender: 'girl', origin: 'نوین', meaning: 'مروارید دریا', popularity: 5 },
  { id: 'elnaz', name: 'الناز', pronunciation: 'Elnaz', gender: 'girl', origin: 'نوین', meaning: 'دارای ناز و ظرافت', popularity: 4 },
  { id: 'baran', name: 'باران', pronunciation: 'Baran', gender: 'girl', origin: 'نوین', meaning: 'باران؛ نماد پاکی و رویش', popularity: 4 },
  { id: 'pegah', name: 'پگاه', pronunciation: 'Pegah', gender: 'girl', origin: 'نوین', meaning: 'سپیده‌دم، آغاز روز', popularity: 3 },
  { id: 'golnaz', name: 'گلناز', pronunciation: 'Golnaz', gender: 'girl', origin: 'نوین', meaning: 'گل نازک و لطیف', popularity: 2 },
  { id: 'negar', name: 'نگار', pronunciation: 'Negar', gender: 'girl', origin: 'نوین', meaning: 'محبوب، نگاشته و نقش زیبا', popularity: 3 },
  { id: 'shabnam', name: 'شبنم', pronunciation: 'Shabnam', gender: 'girl', origin: 'نوین', meaning: 'شبنم؛ قطرهٔ شفاف صبحگاهی', popularity: 3 },
  { id: 'mahour', name: 'ماهور', pronunciation: 'Mahour', gender: 'girl', origin: 'نوین', meaning: 'برگرفته از نام یکی از دستگاه‌های موسیقی ایرانی', popularity: 2 },
  { id: 'kimia', name: 'کیمیا', pronunciation: 'Kimia', gender: 'unisex', origin: 'نوین', meaning: 'اکسیر، چیز گران‌بها', popularity: 4 },
];

export const NAME_ORIGINS: NameOrigin[] = ['باستانی', 'اوستایی', 'شاهنامه‌ای', 'نوین'];
