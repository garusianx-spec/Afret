# بسته‌بندی اندروید (TWA) — گام به گام

هدف: همین PWA، داخل یک APK/AAB، بدون نوار آدرس کروم، آمادهٔ انتشار در
**گوگل‌پلی، کافه‌بازار و مایکت**.

TWA یک WebView نیست؛ یک Custom Tab تمام‌صفحه است که موتور کروم دستگاه را
اجرا می‌کند. یعنی سرویس‌ورکر، IndexedDB و Web Push همان‌طور که در مرورگر کار
می‌کنند، در اپ هم کار می‌کنند — و اعلان‌ها بدون هیچ سیم‌کشی FCM می‌رسند.

## پیش‌نیازها

```bash
npm install -g @bubblewrap/cli
# JDK 17 و Android SDK لازم‌اند؛ بار اول Bubblewrap خودش پیشنهاد نصب می‌دهد:
bubblewrap doctor
```

## گام ۱ — PWA را منتشر کنید

TWA به یک دامنهٔ **HTTPS واقعی** نیاز دارد. `localhost` کار نمی‌کند.

```bash
npm run build --workspace=apps/web
# سپس روی دامنهٔ خودتان منتشر کنید، مثلاً https://afrat.app
```

مطمئن شوید این‌ها در دسترس‌اند:

- `https://afrat.app/manifest.webmanifest`
- `https://afrat.app/.well-known/assetlinks.json`

## گام ۲ — ساخت پروژهٔ اندروید

```bash
cd android
bubblewrap init --manifest https://afrat.app/manifest.webmanifest
```

فایل `twa-manifest.json` در همین پوشه از قبل با مقادیر درست آفرت پر شده
(رنگ تم `#F8F7FC`، `packageId` برابر `app.afrat.twa`، آیکون maskable، و
شورتکات‌ها). می‌توانید به‌جای پاسخ دادن به پرسش‌های تعاملی، مستقیم از آن
استفاده کنید:

```bash
bubblewrap init --manifest https://afrat.app/manifest.webmanifest \
  --directory . --chromeosonly false
```

### چند تنظیم که حتماً باید درست باشند

| کلید | مقدار | چرا |
| --- | --- | --- |
| `packageId` | `app.afrat.twa` | پس از اولین انتشار **قابل تغییر نیست**. |
| `host` | `afrat.app` | باید دقیقاً با دامنهٔ assetlinks یکی باشد. |
| `navigationColor` | `#F8F7FC` | وگرنه نوار ناوبری اندروید سیاه می‌ماند و زیر layout می‌زند. |
| `enableNotifications` | `true` | مجوز `POST_NOTIFICATIONS` را برای اندروید ۱۳+ اضافه می‌کند. |
| `orientation` | `portrait` | اپ mobile-first است. |
| `fallbackType` | `customtabs` | روی دستگاه‌هایی بدون کروم سازگار، به Custom Tab برمی‌گردد. |

## گام ۳ — ساخت و امضا

```bash
# یک‌بار: ساخت کلید آپلود
keytool -genkeypair -v -keystore android.keystore \
  -alias afrat -keyalg RSA -keysize 2048 -validity 10000

bubblewrap build
# خروجی: app-release-signed.apk و app-release-bundle.aab
```

## گام ۴ — Digital Asset Links (مهم‌ترین گام)

اگر این گام درست انجام نشود، اپ **با نوار آدرس کروم** باز می‌شود و دیگر شبیه
یک اپ بومی نیست. این شایع‌ترین اشتباه در بسته‌بندی TWA است.

اثر انگشت‌ها را بگیرید:

```bash
# کلید آپلود شما
keytool -list -v -keystore android.keystore -alias afrat | grep SHA256
```

و **اگر از گوگل‌پلی منتشر می‌کنید**، اثر انگشت دوم را هم لازم دارید:

> Play Console → Setup → App integrity → App signing key certificate → SHA-256

**چرا دوتا؟** گوگل‌پلی با Play App Signing، APK شما را با کلید خودش دوباره
امضا می‌کند. اگر فقط اثر انگشت کلید آپلود را بگذارید، نسخهٔ نصب‌شده از
فروشگاه اعتبارسنجی نمی‌شود. کافه‌بازار و مایکت دوباره امضا نمی‌کنند، پس برای
آن‌ها همان کلید آپلود کافی است.

هر دو را در `apps/web/public/.well-known/assetlinks.json` بگذارید:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.afrat.twa",
      "sha256_cert_fingerprints": [
        "AA:BB:...:FF",
        "11:22:...:99"
      ]
    }
  }
]
```

سپس دوباره منتشر کنید و بررسی کنید:

```bash
curl -s https://afrat.app/.well-known/assetlinks.json | jq .
```

فایل باید بدون ریدایرکت، روی HTTPS، و با `Content-Type: application/json`
سرو شود — هدرهایش در `apps/web/next.config.mjs` تنظیم شده‌اند.

### تست اعتبارسنجی روی دستگاه

```bash
adb install app-release-signed.apk
adb logcat | grep -i "asset_statements\|digital_asset"
```

اگر اپ باز شد و **نوار آدرس نبود**، اعتبارسنجی موفق بوده است.

## گام ۵ — انتشار

### گوگل‌پلی

- فایل `.aab` را آپلود کنید.
- Play App Signing را فعال نگه دارید و اثر انگشت دومش را (گام ۴) اضافه کنید.
- در بخش Data safety اعلام کنید که داده‌های سلامت جمع‌آوری می‌شود؛ سیاست
  Health Apps گوگل برای اپ‌های بارداری سخت‌گیر است.

### کافه‌بازار و مایکت

- فایل `.apk` را آپلود کنید (هر دو AAB را به‌خوبی نمی‌پذیرند).
- چون دوباره امضا نمی‌کنند، همان اثر انگشت کلید آپلود کافی است.
- نکته: روی دستگاه‌هایی که سرویس‌های گوگل ندارند، کروم ممکن است نصب نباشد.
  `fallbackType: "customtabs"` باعث می‌شود اپ روی مرورگر سازگار دیگری باز
  شود به‌جای اینکه کرش کند. این حالت را حتماً روی یک دستگاه بدون GMS تست کنید.

## عیب‌یابی

| نشانه | علت | راه‌حل |
| --- | --- | --- |
| نوار آدرس کروم دیده می‌شود | assetlinks نامعتبر | اثر انگشت Play App Signing را اضافه کنید |
| صفحهٔ سفید هنگام اجرا | `startUrl` خارج از `scope` | هر دو را در manifest بررسی کنید |
| اعلان نمی‌آید | مجوز اندروید ۱۳+ | `enableNotifications: true` و درخواست مجوز در اپ |
| نوار ناوبری سیاه | `navigationColor` تنظیم نشده | در `twa-manifest.json` مقدار بدهید |
| محتوا زیر notch می‌رود | `viewport-fit=cover` بدون padding | کلاس‌های `afrat-safe-*` را به‌کار ببرید |
