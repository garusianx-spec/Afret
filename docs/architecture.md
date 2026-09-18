# ساختار پوشه‌ها

مخزن یک npm workspace با دو اپلیکیشن است.

```
afrat/
├── apps/
│   ├── web/                 ← PWA (Next.js 15، App Router)
│   └── realtime/            ← سرویس REST + WebSocket (Fastify + Socket.io)
├── android/                 ← پیکربندی TWA برای Bubblewrap
└── docs/                    ← همین مستندات
```

## `apps/web`

```
apps/web/
├── public/
│   ├── manifest.webmanifest        نصب PWA، شورتکات‌ها، آیکون‌ها
│   ├── sw.js                       سرویس‌ورکر دست‌نویس (کش + push + sync)
│   ├── offline.html                پوستهٔ آفلاین، مستقل از باندل
│   ├── brand/                      نماد و لوگوتایپ (منبع تولید آیکون)
│   ├── icons/                      PNGهای تولیدشده از brand/mark.svg
│   ├── audio/                      نویز سفید و لالایی (commit نمی‌شود)
│   └── .well-known/assetlinks.json اعتبارسنجی TWA
│
├── scripts/
│   └── generate-icons.mjs          رستر کردن SVG برند به کل مجموعهٔ PNG
│
└── src/
    ├── fonts/                      IranYekan Web + پیکربندی next/font
    │
    ├── app/                        مسیریابی — فقط ترکیب، نه منطق
    │   ├── layout.tsx              html[lang=fa-IR][dir=rtl]، متادیتا، viewport
    │   ├── globals.css             توکن‌ها، @font-face، ابزارهای پایه
    │   ├── (tabs)/                 پوستهٔ پنج‌تبی
    │   │   ├── layout.tsx          BottomNav
    │   │   ├── page.tsx            خانه
    │   │   ├── tracker/page.tsx    تقویم و ردیاب
    │   │   ├── nutrition/page.tsx  رژیم و تغذیه
    │   │   ├── chat/page.tsx       فهرست گفتگوها
    │   │   └── profile/page.tsx    حساب و ابزارها
    │   └── chat/[roomId]/page.tsx  اتاق گفتگو (بیرون از تب‌ها، تمام‌صفحه)
    │
    ├── modules/                    ← قلب اپ؛ هر ماژول خودکفاست
    │   ├── auth/
    │   │   ├── AuthProvider.tsx        نشست، تازه‌سازی بی‌صدا، تمدید پیش‌دستانه
    │   │   ├── api/authApi.ts          register / login / refresh / me
    │   │   ├── store/authStore.ts      توکن فقط در حافظه، کاربر در sessionStorage
    │   │   ├── lib/tokenBridge.ts      پل به ماژول‌های خارج از React
    │   │   ├── lib/mobile.ts           نرمال‌سازی موبایل + سنجش قدرت رمز
    │   │   └── components/             AuthScreen, AuthGate, AccountCard, BrandMark
    │   │
    │   ├── chat/
    │   │   ├── api/chatApi.ts          REST: تاریخچه، جستجو، آپلود presigned
    │   │   ├── hooks/useChatSocket.ts  چرخهٔ عمر سوکت + ارسال + صفحه‌بندی
    │   │   ├── hooks/useRooms.ts       فهرست اتاق‌ها با fallback آفلاین
    │   │   ├── lib/socketClient.ts     سوکت مشترک، backoff، watchdog
    │   │   ├── lib/outbox.ts           صف IndexedDB (Dexie)
    │   │   ├── store/chatStore.ts      Zustand: پیام‌ها، حضور، تیک‌ها
    │   │   ├── components/             ChatRoom, MessageBubble, Composer…
    │   │   ├── data/demoRooms.ts       fallback وقتی سرویس در دسترس نیست
    │   │   └── types.ts                قرارداد wire
    │   │
    │   ├── tracker/
    │   │   ├── lib/gestation.ts        سن بارداری + override بالینی
    │   │   ├── lib/cycle.ts            پیش‌بینی چرخه، پنجرهٔ باروری، سن نوزاد
    │   │   ├── data/weeklyContent.ts   محتوای هفته‌به‌هفته
    │   │   ├── data/vaccinations.ts    برنامهٔ ایمن‌سازی کشوری + مهارت‌های رشدی
    │   │   ├── store/healthLogStore.ts وزن، قند، فشار، خلق، تهوع
    │   │   └── components/
    │   │
    │   ├── nutrition/
    │   │   ├── data/foodSafety.ts      پایگاه ایمنی خوراکی در بارداری
    │   │   ├── data/nutrientFocus.ts   نیاز مغذی بر حسب سه‌ماهه
    │   │   ├── lib/search.ts           نرمال‌سازی فارسی + جستجوی رتبه‌بندی‌شده
    │   │   └── components/
    │   │
    │   ├── home/                       هیروی پویا، پیام روز، چک‌لیست
    │   └── profile/
    │       ├── hooks/useBackgroundAudio.ts  پخش مقاوم روی مرورگر موبایل
    │       └── components/             آلبوم خاطرات، پخش صدا، چک‌لیست‌ها
    │
    ├── components/
    │   ├── ui/                     Card, Chip, ProgressRing, SectionTitle
    │   ├── layout/                 BottomNav, AppHeader
    │   ├── pwa/                    ثبت SW، پیشنهاد نصب، اشتراک push
    │   └── providers/              QueryClient + ثبت سرویس‌ورکر
    │
    ├── lib/                        persian.ts, jalali.ts, utils.ts, config.ts
    ├── stores/userStore.ts         پروفایل و توکن (persist شده)
    ├── hooks/useHydrated.ts        گارد hydration برای استورهای persist شده
    └── types/domain.ts             UserProfile, LifecycleMode, BabyProfile
```

### قاعده‌ای که ساختار را نگه می‌دارد

`app/` فقط **ترکیب** می‌کند. هر منطق دامنه‌ای داخل `modules/<نام>/` زندگی
می‌کند. یعنی:

- یک صفحه هرگز بیش از چند ده خط نیست.
- ماژول `chat` را می‌شود بدون دست زدن به مسیریابی تست یا جایگزین کرد.
- افزودن ماژول ششم (مثلاً `community/` برای انجمن و اسامی نوزاد) هیچ فایل
  موجودی را تغییر نمی‌دهد.

## `apps/realtime`

```
apps/realtime/src/
├── index.ts                    راه‌اندازی Fastify، اتصال Socket.io، خاموشی نرم
├── env.ts                      اعتبارسنجی محیط با zod (fail-fast)
├── redis.ts                    جفت اتصال pub/sub برای adapter
├── types.ts                    آینهٔ قرارداد wire
├── auth/
│   ├── mobile.ts               نرمال‌سازی شمارهٔ موبایل ایران
│   ├── password.ts             هش Argon2id + سیاست رمز
│   ├── tokens.ts               امضا/تأیید JWT، توکن تازه‌سازی، کوکی
│   ├── userStore.ts            حساب‌ها و نشست‌ها (اینترفیس + in-memory)
│   ├── otp.ts                  OTP پیامکی — معماری آماده، ارائه‌دهنده وصل نیست
│   ├── middleware.ts           requireAuth / requirePermission / toChatUser
│   └── types.ts                نقش‌ها، دسترسی‌ها، شکل عمومی کاربر
├── http/
│   ├── authRoutes.ts           register / login / refresh / logout / me
│   ├── chatRoutes.ts           تاریخچه، since، جستجو، عضویت، اعلان اتاق
│   └── pushRoutes.ts           اشتراک/لغو اشتراک Web Push
├── realtime/
│   ├── gateway.ts              احراز هویت handshake، رویدادها، محدودسازی نرخ
│   └── presence.ts             حضور با شمارندهٔ مرجع (Redis یا محلی)
├── store/
│   ├── messageStore.ts         اینترفیس + پیاده‌سازی in-memory
│   └── membershipStore.ts      عضویت اتاق — پایهٔ push گروهی
└── push/webPush.ts             ارسال VAPID + هرس endpointهای مرده
```

`MessageStore` یک اینترفیس است. شِمای Postgres پیشنهادی در بالای همان فایل
مستند شده؛ تعویض پیاده‌سازی هیچ فایل دیگری را تغییر نمی‌دهد.

## جریان داده

```
   AuthProvider ──▶ authStore (توکن در حافظه) ──▶ tokenBridge
        │                                              │
        │                                              ├─▶ chatApi (هدر Bearer)
        │                                              └─▶ socketClient (handshake)
        ▼
   AuthGate ──▶ صفحه (Server Component)
        │
        ▼
   کامپوننت کلاینت ──▶ useChatSocket ──┬─▶ chatStore (Zustand)   ← رندر
        │                              ├─▶ socketClient          ← رویداد زنده
        │                              ├─▶ chatApi               ← تاریخچه/پشتیبان
        │                              └─▶ outbox (IndexedDB)    ← دوام آفلاین
        │
        └──▶ useRooms (TanStack Query) ──▶ chatApi ──▶ fallback به demoRooms
```

## دستورها

```bash
npm install                     # نصب هر دو workspace

npm run dev                     # وب روی :3000
npm run dev:realtime            # سرویس بلادرنگ روی :4000

npm run build                   # بیلد تولید وب
npm run typecheck               # tsc --noEmit در هر دو workspace
npm run lint                    # ESLint وب
```

آیکون‌ها پس از تغییر SVG برند:

```bash
node apps/web/scripts/generate-icons.mjs
```
