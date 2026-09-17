import type { MealPlan } from '../types';

/**
 * Placeholder plan rendered until a clinician-prescribed one is synced.
 * `prescribedBy` is always shown so the mother knows the provenance.
 */
export const SAMPLE_MEAL_PLAN: MealPlan = {
  id: 'plan_demo',
  prescribedBy: 'دکتر سارا احمدی — متخصص تغذیه',
  prescribedOn: '2025-09-01',
  note: 'برنامهٔ سه‌ماههٔ دوم با تمرکز بر کنترل قند خون و تأمین آهن.',
  targets: { kcal: 2200, proteinG: 95, carbsG: 250, fatG: 75 },
  meals: [
    {
      slot: 'breakfast',
      time: '07:30',
      items: [
        {
          id: 'b1',
          title: 'نان سنگک سبوس‌دار با پنیر پاستوریزه و گردو',
          portion: '۲ کف دست نان + ۳۰ گرم پنیر + ۳ مغز گردو',
          macros: { kcal: 420, proteinG: 18, carbsG: 45, fatG: 18 },
        },
        {
          id: 'b2',
          title: 'چای کم‌رنگ یا شیر گرم',
          portion: 'یک لیوان',
          macros: { kcal: 90, proteinG: 6, carbsG: 9, fatG: 3 },
        },
      ],
    },
    {
      slot: 'midMorning',
      time: '10:30',
      items: [
        {
          id: 'm1',
          title: 'یک عدد سیب متوسط + ۱۰ عدد بادام خام',
          portion: '۱ واحد میوه + ۱۵ گرم مغز',
          macros: { kcal: 180, proteinG: 5, carbsG: 22, fatG: 9 },
        },
      ],
    },
    {
      slot: 'lunch',
      time: '13:30',
      items: [
        {
          id: 'l1',
          title: 'خورش عدس با برنج قهوه‌ای',
          portion: '۱ پیمانه برنج + ۱ کفگیر خورش',
          macros: { kcal: 620, proteinG: 26, carbsG: 88, fatG: 16 },
        },
        {
          id: 'l2',
          title: 'سالاد فصل با روغن زیتون و لیمو',
          portion: 'یک کاسهٔ متوسط',
          macros: { kcal: 140, proteinG: 3, carbsG: 10, fatG: 10 },
        },
      ],
    },
    {
      slot: 'snack',
      time: '17:00',
      items: [
        {
          id: 's1',
          title: 'ماست یونانی با خرما',
          portion: '۱۵۰ گرم ماست + ۲ عدد خرما',
          macros: { kcal: 230, proteinG: 14, carbsG: 28, fatG: 6 },
        },
      ],
    },
    {
      slot: 'dinner',
      time: '20:00',
      items: [
        {
          id: 'd1',
          title: 'ماهی سالمون کبابی با سبزیجات بخارپز',
          portion: '۱۲۰ گرم ماهی + ۱ پیمانه سبزیجات',
          macros: { kcal: 470, proteinG: 34, carbsG: 22, fatG: 26 },
        },
      ],
    },
  ],
};
