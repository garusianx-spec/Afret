<div align="center">

# آفرت — Afrat

**اپلیکیشن جامع سلامت مادر و زن** · PWA + TWA · فارسی، RTL

از ردیابی قاعدگی تا تلاش برای بارداری، بارداری و تغذیه، تا مراقبت از نوزاد
و گفتگو با متخصصان.

</div>

---

## چه چیزی ساخته شده

| ماژول | وضعیت |
| --- | --- |
| خانه — داشبورد پویا بر اساس وضعیت کاربر، «پیام روز»، چک‌لیست روزانه | ✅ |
| تقویم و ردیاب — سن بارداری با اصلاح سونوگرافی، چرخهٔ قاعدگی، ثبت وزن/قند/فشار/خلق | ✅ |
| رژیم و تغذیه — نیاز مغذی هفتگی، برنامهٔ تجویزی با ردیابی درشت‌مغذی، جستجوی ایمنی خوراکی | ✅ |
| گفتگو — اتاق‌های عمومی، مشاورهٔ خصوصی، تایپینگ، حضور، تیک دیده‌شده، صف آفلاین | ✅ |
| حساب و ابزارها — آلبوم خاطرات، پخش نویز سفید و لالایی، ساک زایمان، سیسمونی | ✅ |
| احراز هویت — موبایل + رمز، Argon2id، JWT + refresh چرخشی، نقش و دسترسی | ✅ |
| عضویت اتاق و اعلان push گروهی | ✅ |
| PWA — سرویس‌ورکر، آفلاین، Web Push، Background Sync | ✅ |
| TWA — پیکربندی Bubblewrap و Digital Asset Links | ✅ |
| تأیید شماره با پیامک (OTP) | 🔌 معماری آماده، ارائه‌دهنده وصل نیست |
| انجمن و اسامی نوزاد | ⏳ برنامه‌ریزی‌شده |

## شروع سریع

```bash
npm install

# ترمینال ۱ — سرویس بلادرنگ (:4000)
npm run dev:realtime

# ترمینال ۲ — وب (:3000)
npm run dev
```

بعد `http://localhost:3000` را باز کنید.

اپ بدون سرویس بلادرنگ هم بالا می‌آید: فهرست اتاق‌ها به دادهٔ نمونه برمی‌گردد
و نوار وضعیت اتصال، حالت تنزل‌یافته را نشان می‌دهد.

### پیکربندی

```bash
cp apps/web/.env.example      apps/web/.env.local
cp apps/realtime/.env.example apps/realtime/.env
```

مهم‌ترین متغیرها:

| متغیر | کجا | توضیح |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | web | ریشهٔ REST سرویس بلادرنگ |
| `NEXT_PUBLIC_SOCKET_URL` | web | ریشهٔ WebSocket (معمولاً همان بالا) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | web | کلید عمومی Web Push |
| `CORS_ORIGINS` | realtime | مبدأهای مجاز مرورگر، با کاما — برای کوکی refresh لازم است |
| `JWT_SECRET` | realtime | **در تولید اجباری**؛ حداقل ۳۲ نویسه |
| `REDIS_URL` | realtime | لازم برای بیش از یک نمونه |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | realtime | `npx web-push generate-vapid-keys` |

ساخت `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## ساختار

```
apps/web/        PWA — Next.js 15، Tailwind، Zustand، TanStack Query
apps/realtime/   Fastify 5 + Socket.io 4 + Redis Pub/Sub
android/         پیکربندی TWA برای Bubblewrap
docs/            مستندات معماری
```

جزئیات در [`docs/architecture.md`](docs/architecture.md).

## مستندات

| سند | موضوع |
| --- | --- |
| [`docs/tech-stack.md`](docs/tech-stack.md) | چه چیزی انتخاب شد و **چرا** |
| [`docs/architecture.md`](docs/architecture.md) | ساختار پوشه‌ها و جریان داده |
| [`docs/realtime-chat.md`](docs/realtime-chat.md) | پروتکل گفتگو، چرخهٔ عمر پیام، مقیاس‌پذیری |
| [`docs/pwa-strategy.md`](docs/pwa-strategy.md) | نقشهٔ کش، صف آفلاین، Web Push |
| [`docs/twa-android.md`](docs/twa-android.md) | بسته‌بندی اندروید گام‌به‌گام |
| [`docs/authentication.md`](docs/authentication.md) | جریان ورود، چرخش توکن، نقش‌ها، OTP |
| [`docs/design-system.md`](docs/design-system.md) | توکن‌ها، ارقام فارسی، RTL، دسترس‌پذیری |

## دستورها

```bash
npm run dev            # وب روی :3000
npm run dev:realtime   # سرویس بلادرنگ روی :4000
npm run build          # بیلد تولید
npm run typecheck      # tsc --noEmit در هر دو workspace
npm run lint           # ESLint

node apps/web/scripts/generate-icons.mjs   # بازسازی PNGها از SVG برند
```

## دارایی‌های برند

| دارایی | کجاست | راهنما |
| --- | --- | --- |
| فونت IranYekan Web (۳ وزن) | `apps/web/src/fonts/` | [README](apps/web/src/fonts/README.md) |
| نماد و لوگوتایپ | `apps/web/public/brand/` | [README](apps/web/public/brand/README.md) |
| آیکون‌های PWA/TWA | `apps/web/public/icons/` | تولیدشده — دست نزنید |
| فایل‌های صوتی | `apps/web/public/audio/` | [README](apps/web/public/audio/README.md) — در مخزن نیستند |

### جایگزینی فونت

فایل `.woff2` را در `apps/web/src/fonts/` بگذارید و یک ورودی به آرایهٔ `src`
در `apps/web/src/fonts/index.ts` اضافه کنید. `next/font/local` بقیه‌اش را
انجام می‌دهد — نه `globals.css` تغییر می‌کند نه `tailwind.config.ts`.

### جایگزینی لوگو

`apps/web/public/brand/mark.svg` را عوض کنید (باید یک `<path>` با
`fill="currentColor"` و یک `viewBox` داشته باشد)، سپس:

```bash
node apps/web/scripts/generate-icons.mjs
```

این دستور کل مجموعه را بازتولید می‌کند: آیکون manifest، نسخه‌های maskable
اندروید، آیکون iOS، تصاویر splash برای TWA و فاوآیکون. مسیر درون‌خطی در
`src/modules/auth/components/BrandMark.tsx` را هم به‌روزرسانی کنید.

### فایل‌های صوتی

`.mp3` (ترجیحاً) را در `apps/web/public/audio/` بگذارید. نام‌ها باید با
`SOUND_LIBRARY` در `src/modules/profile/data/checklists.ts` بخوانند. فایل‌ها
باید loop-safe باشند — پخش با `loop = true` انجام می‌شود و هر سکوت ابتدا یا
انتها در هر چرخه شنیده می‌شود.

## هشدار پزشکی

آفرت یک ابزار آموزشی و ردیابی است، **نه** ابزار تشخیص. هیچ محتوایی در این
مخزن نباید مبنای تصمیم بالینی قرار گیرد. مسیر مشاوره در ماژول گفتگو برای
ارتباط با پزشک واقعی طراحی شده و محتوای ایستا عمداً غیرتشخیصی نگه داشته شده
است.

پیش از انتشار در گوگل‌پلی، سیاست Health Apps را مرور کنید؛ برای اپ‌های
بارداری سخت‌گیرانه اعمال می‌شود.
