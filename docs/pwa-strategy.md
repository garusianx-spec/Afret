# استراتژی PWA — کش، آفلاین و اعلان

سرویس‌ورکر آفرت دست‌نویس است (`apps/web/public/sw.js`) نه تولیدشده. دلیلش یک
محدودیت مشخص است: روی شبکهٔ موبایل ایران، اتصال مدام قطع و کند می‌شود، و هر
استراتژی باید **timeout صریح** و **fallback صریح** داشته باشد. معادل Workbox
هر قانون در جدول زیر آمده تا اگر روزی به Workbox/Serwist مهاجرت کردید، نگاشت
مستقیم باشد.

## نقشهٔ کش

| مسیر | استراتژی | معادل Workbox | timeout | سقف |
| --- | --- | --- | --- | --- |
| ناوبری (`mode: navigate`) | network-first → کش → `/offline.html` | `NetworkFirst` | ۳٫۵ ثانیه | — |
| `/_next/static/*` | cache-first | `CacheFirst` | — | — |
| `/fonts/*` | cache-first | `CacheFirst` | — | — |
| `/audio/*` | cache-first | `CacheFirst` | — | ۱۲ فایل |
| تصاویر | stale-while-revalidate | `StaleWhileRevalidate` | — | ۸۰ ورودی |
| `GET /api/*` | network-first → کش | `NetworkFirst` | ۶ ثانیه | ۶۰ ورودی |
| `/realtime/*` | **دست نخورده** | — | — | — |

ترافیک Socket.io هرگز رهگیری نمی‌شود: بافر یا بازپخش فریم‌های long-polling
پروتکل را خراب می‌کند.

### چرا timeout مهم‌تر از ترتیب است

یک اتصال TCP که ۳۰ ثانیه معلق می‌ماند بدتر از رندر فوری از کش است. به همین
دلیل `fetchWithTimeout` در هر مسیر شبکه‌محور استفاده شده و نه فقط `fetch`.

### مدیریت نسخه

- هر نام کش پسوند `VERSION` دارد؛ در `activate` هر کش `afrat-*` که در نسخهٔ
  جاری نیست حذف می‌شود.
- `/sw.js` با هدر `no-cache, no-store, must-revalidate` سرو می‌شود
  (`next.config.mjs`) وگرنه کاربر روی پوستهٔ قدیمی گیر می‌کند.
- precache با `new Request(url, { cache: 'reload' })` انجام می‌شود تا کش HTTP
  مرورگر نسخهٔ کهنه را جا نیندازد.

### به‌روزرسانی بدون از دست رفتن کار کاربر

`ServiceWorkerRegistrar` عمداً **reload خودکار نمی‌کند**. مادری که وسط ثبت قند
خون است نباید فرمش را به یک به‌روزرسانی پس‌زمینه ببازد. به‌جایش یک نوار
«نسخهٔ جدید آفرت آماده است» نشان داده می‌شود و فقط با تأیید کاربر
`SKIP_WAITING` ارسال و صفحه بارگذاری می‌شود.

## صف آفلاین و Background Sync

```
کاربر می‌نویسد
   │
   ├─▶ حباب خوش‌بینانه (delivery: 'queued')     ← فوری، حتی روی خط قطع
   ├─▶ IndexedDB `afrat-chat.outbox`            ← دوام؛ بستن تب پیام را نمی‌برد
   ├─▶ تلاش سوکت (ack با timeout ۱۰ ثانیه)
   ├─▶ در صورت شکست: POST HTTP با `Idempotency-Key`
   └─▶ در صورت آفلاین بودن: `sync` با تگ `afrat-outbox-sync`
```

سرویس‌ورکر همان object store را مستقیماً می‌خواند و پیام‌ها را به ترتیب
`queuedAt` ارسال می‌کند — انفجار سه‌پیامی مادر نباید درهم‌ریخته برسد. پاسخ‌های
۴xx پایانی تلقی و از صف حذف می‌شوند تا حلقهٔ بی‌نهایت retry شکل نگیرد؛ ۵xx صف
را نگه می‌دارد.

> Background Sync در سافاری و فایرفاکس پشتیبانی نمی‌شود. آنجا
> `useChatSocket` در رویدادهای `online` و `visibilitychange` صف را خالی می‌کند.
> یعنی مسیر پشتیبان همیشه وجود دارد.

## Web Push

۱. کلیدها را بسازید:

```bash
npx web-push generate-vapid-keys
```

۲. کلید عمومی را در `apps/web/.env.local` بگذارید:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM...
```

۳. هر دو کلید را در `apps/realtime/.env` بگذارید.

۴. کاربر از «حساب و ابزارها → اعلان‌ها» اشتراک را فعال می‌کند
   (`usePushSubscription`).

نکته‌های پیاده‌سازی:

- `userVisibleOnly: true` اجباری است؛ push خاموش در وب مجاز نیست.
- `tag` روی `room-<roomId>` تنظیم شده تا پنج پیام یک پزشک یک اعلان باشد نه پنج‌تا.
- سرور فقط وقتی push می‌فرستد که گیرنده **سوکت زنده در آن اتاق** نداشته باشد؛
  مادری که همان گفتگو را باز کرده نباید برای پیام روی صفحه اعلان بگیرد.
- خطاهای ۴۰۴/۴۱۰ یعنی endpoint برای همیشه رفته؛ در `webPush.ts` هرس می‌شوند.

## چک‌لیست قبل از انتشار

- [ ] `npm run build` در `apps/web` بدون خطا.
- [ ] Lighthouse → PWA: قابل نصب، آفلاین کار می‌کند.
- [ ] با DevTools → Network → Offline، ناوبری به `/offline.html` می‌رسد.
- [ ] نوشتن پیام در حالت آفلاین، بستن تب، آنلاین شدن → پیام ارسال می‌شود.
- [ ] `/manifest.webmanifest` با `Content-Type: application/manifest+json`.
- [ ] آیکون‌ها با `node scripts/generate-icons.mjs` ساخته شده‌اند.
- [ ] اسکرین‌شات‌های `public/screenshots/` برای کارت نصب اضافه شده‌اند.
