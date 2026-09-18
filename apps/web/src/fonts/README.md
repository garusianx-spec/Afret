# فونت برند — IranYekan Web

سه وزن استاتیک فونت اینجا قرار دارند و توسط `next/font/local` بارگذاری
می‌شوند (`index.ts` در همین پوشه):

| فایل | وزن | کاربرد |
| --- | --- | --- |
| `IRANYekanWeb-Regular.woff2` | ۴۰۰ | متن بدنه |
| `IRANYekanWeb-Medium.woff2` | ۵۰۰ | برچسب‌ها و دکمه‌های فرعی |
| `IRANYekanWeb-Bold.woff2` | ۷۰۰ | تیترها و دکمه‌های اصلی |

## چرا `next/font/local` و نه `@font-face` دستی

- Next خودش `<link rel="preload">` می‌سازد، پس فونت هم‌زمان با HTML شروع به
  دانلود می‌کند نه بعد از پارس شدن CSS.
- آدرس فایل fingerprint می‌شود و زیر `/_next/static/media/` با هدر immutable
  سرو می‌شود؛ سرویس‌ورکر هم همان‌جا cache-first نگهش می‌دارد.
- نام خانوادگی فونت به‌صورت خودکار در متغیر `--afrat-font-sans` قرار می‌گیرد
  که Tailwind از آن به‌عنوان `font-sans` استفاده می‌کند.

## اضافه یا تعویض کردن وزن

۱. فایل `.woff2` را در همین پوشه بگذارید.
۲. یک ورودی به آرایهٔ `src` در `index.ts` اضافه کنید:

```ts
{ path: './IRANYekanWeb-ExtraBold.woff2', weight: '800', style: 'normal' },
```

۳. تمام. نیازی به تغییر `globals.css` یا `tailwind.config.ts` نیست.

## اگر نسخهٔ Variable (VF) دارید

نسخهٔ VF یک فایل به‌جای سه‌تاست و کل بازهٔ وزن را پوشش می‌دهد. جایگزینی:

```ts
src: [{ path: './IRANYekanX-VF.woff2', weight: '100 900', style: 'normal' }],
```

## لایسنس

IranYekan فونت تجاری است. این فایل‌ها با لایسنس در اختیار پروژه قرار
گرفته‌اند و در مخزن نگهداری می‌شوند. اگر مخزن را عمومی می‌کنید، شرایط لایسنس
خود را بررسی کنید — ممکن است لازم باشد این پوشه را به `.gitignore` برگردانید
و فونت را در زمان build تزریق کنید.
