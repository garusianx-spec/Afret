# معماری گفتگوی بلادرنگ

سیستم ترکیبی HTTP + WebSocket. تقسیم کار ساده است:

- **HTTP/REST** برای هر چیزی که «حالت» است: تاریخچه، جستجو، متادیتای اتاق،
  آپلود فایل — و مسیر پشتیبان ارسال.
- **WebSocket** برای هر چیزی که «رویداد» است: پیام زنده، «در حال نوشتن…»،
  حضور، تیک دیده‌شده، واکنش.

## چرخهٔ عمر یک پیام

```
 ۱. کاربر Enter می‌زند
     │
 ۲. حباب خوش‌بینانه          delivery: 'queued'   (ساعت‌شنی)
     │                       ← فوری، حتی روی خط قطع
 ۳. نوشتن در IndexedDB       afrat-chat.outbox
     │                       ← بستن تب پیام را نمی‌برد
 ۴. socket.emit(..., ack)    delivery: 'sending'
     │
     ├── ack موفق ─────────▶ delivery: 'sent'      (یک تیک)
     │                       seq و id قطعی جایگزین می‌شوند
     │
     ├── ack نیامد (۱۰s) ──▶ POST /api/chat/rooms/:id/messages
     │                       با هدر Idempotency-Key
     │
     └── آفلاین ───────────▶ در صف می‌ماند + Background Sync
                             ← سرویس‌ورکر بعداً می‌فرستد

 ۵. گیرنده دریافت می‌کند  ─▶ delivery: 'delivered'  (دو تیک)
 ۶. گیرنده می‌خواند       ─▶ delivery: 'read'       (دو تیک سبز)
```

### چرا `clientId` ستون فقرات است

هر پیام یک `clientId` تولیدشده در کلاینت دارد که از حباب خوش‌بینانه تا رکورد
قطعی سرور زنده می‌ماند. سه کار انجام می‌دهد:

1. **حذف تکرار در UI** — وقتی سرور پیام را برمی‌گرداند، کلاینت حباب موجود را
   پیدا و به‌روزرسانی می‌کند به‌جای اینکه یک حباب دوم بسازد.
2. **Idempotency در سرور** — `UNIQUE (room_id, client_id)`. تلاش دوباره پس از
   timeout پیام تکراری نمی‌سازد؛ همان رکورد اول برمی‌گردد.
3. **کلید صف آفلاین** — کلید اصلی object store در IndexedDB.

### چرا `seq` و نه `createdAt`

ساعت گوشی‌ها اشتباه است. `seq` یک شمارندهٔ صعودی **به‌ازای هر اتاق** است که
سرور می‌دهد و:

- ترتیب قطعی پیام‌ها را تعیین می‌کند؛
- صفحه‌بندی مبتنی بر cursor را ممکن می‌کند (offset با ورود پیام جدید می‌لغزد)؛
- هدف تیک دیده‌شده است: «هر چیزی با `seq <= lastReadSeq` خوانده شده».

## پایداری روی شبکهٔ لرزان

| مشکل | راه‌حل | کجا |
| --- | --- | --- |
| upgrade به WebSocket مسدود است | `transports: ['websocket', 'polling']` — بی‌صدا روی polling می‌ماند | `socketClient.ts` |
| اتصال قطع می‌شود | reconnect با backoff نمایی + jitter (`randomizationFactor: 0.5`) | `socketClient.ts` |
| قطع بی‌صدا (NAT rebinding) | watchdog: اگر ۴۵ ثانیه بسته‌ای نیاید، reconnect اجباری | `installHeartbeatWatchdog` |
| سرور ما را بیرون انداخت | `io server disconnect` → `connect()` صریح | `useChatSocket` |
| بازگشت از پس‌زمینه در اندروید | `visibilitychange` → نخ زدن به سوکت + خالی کردن صف | `useChatSocket` |
| جا ماندن از پیام‌ها | `room:join` با `sinceSeq` → backfill از REST | `useChatSocket` |
| «در حال نوشتن» گیر می‌کند | TTL شش ثانیه‌ای سمت کلاینت، مستقل از سیگنال توقف | `chatStore.pruneTyping` |
| هجوم reconnect پس از ری‌استارت | jitter در backoff گله را پخش می‌کند | `socketClient.ts` |

### ضربان قلب

Socket.io خودش ping/pong دارد (`pingInterval: 25s`, `pingTimeout: 20s`) که
حدود ۴۵ ثانیه‌ای یک همتای مرده را تشخیص می‌دهد. اما یک قطع **بی‌صدا** ممکن
است سوکت را در توهم اتصال نگه دارد. به همین دلیل یک probe سطح‌اپلیکیشن هم
اضافه شده. در تب‌های پس‌زمینه probe غیرفعال می‌شود — مرورگر تایمرها را throttle
می‌کند و نباید سوکت را بابت آن جریمه کرد.

## صفحه‌بندی cursor-محور

```
GET /api/chat/rooms/:roomId/messages?limit=30
  → { messages: [...], nextCursor: "c2VxOjQyMQ" }

GET /api/chat/rooms/:roomId/messages?limit=30&cursor=c2VxOjQyMQ
  → صفحهٔ قدیمی‌تر
```

`nextCursor === null` یعنی به ابتدای تاریخچه رسیده‌ایم. کلاینت با
`hasLoadedOnce` بین «تمام شد» و «هنوز واکشی نشده» تفاوت می‌گذارد.

cursor مبنای base64 از `seq:<n>` است — مبهم نگه داشته می‌شود تا کلاینت به آن
وابسته نشود.

> **چرا offset نه:** اگر کاربر در حال اسکرول تاریخچه باشد و کسی پیام بفرستد،
> هر صفحهٔ بعدی یک ردیف می‌لغزد و کاربر یک پیام را دوبار یا هرگز نمی‌بیند.

## مقیاس افقی

```
نمونهٔ A ──┐                      ┌── سوکت‌های متصل به A
           ├─▶ Redis Pub/Sub ─────┤
نمونهٔ B ──┘                      └── سوکت‌های متصل به B
```

`@socket.io/redis-adapter` دو اتصال جدا لازم دارد: اتصال subscriber وارد حالت
subscribe می‌شود و دیگر نمی‌تواند دستور عادی بفرستد. `createRedisPair()` این
را رعایت می‌کند.

حضور (presence) هم در Redis نگهداری می‌شود و **با شمارندهٔ مرجع** کار می‌کند:
یک مادر اغلب PWA را روی گوشی و سایت را روی لپ‌تاپ باز دارد؛ بستن یک تب نباید
او را آفلاین نشان دهد.

## محدودسازی نرخ

سطل توکن به‌ازای هر سوکت: ظرفیت ۱۲، پرشدن ۲ در ثانیه. گفتگو انفجاری است، پس
یک burst اجازه داده می‌شود و بعد قطره‌ای. رد شدن از سقف یک ack با
`retryable: true` برمی‌گرداند تا کلاینت بعداً دوباره تلاش کند.

## پروتکل

قرارداد کامل در دو فایل آینه‌ای تعریف شده:

- `apps/web/src/modules/chat/types.ts`
- `apps/realtime/src/types.ts`

اگر روزی لازم شد مستقل تکامل پیدا کنند، به‌جای اینکه بگذارید از هم فاصله
بگیرند، آن‌ها را به یک workspace به نام `packages/contracts` منتقل کنید.

### رویدادهای سرور → کلاینت

| رویداد | payload |
| --- | --- |
| `message:new` | پیام کامل |
| `message:ack` | `{ clientId, id, seq, createdAt }` |
| `message:updated` / `message:deleted` | پیام / `{ roomId, id }` |
| `reaction:updated` | `{ roomId, messageId, reactions }` |
| `typing:update` | `{ roomId, userId, displayName, typing }` |
| `presence:update` | `{ roomId, entries }` |
| `receipt:update` | `{ roomId, userId, lastReadSeq, at }` |

### رویدادهای کلاینت → سرور

| رویداد | ack دارد؟ |
| --- | --- |
| `room:join` | بله — `{ ok, latestSeq }` |
| `room:leave` | خیر |
| `message:send` | بله — `MessageAck` |
| `typing:set` | خیر |
| `receipt:read` | خیر |
| `reaction:toggle` | خیر |

`typing:set` عمداً throttle شده: یک emit در هر ۲٫۵ ثانیه، نه یکی به‌ازای هر
کلید. یک debounce سه‌ثانیه‌ای هم سیگنال توقف را می‌فرستد.
