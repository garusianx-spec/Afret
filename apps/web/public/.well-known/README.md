# ‎`/.well-known/assetlinks.json`

این فایل «Digital Asset Links» است و پایهٔ اعتبارسنجی TWA محسوب می‌شود. اگر
اثر انگشت گواهی داخل آن با گواهی امضای APK/AAB مطابقت نداشته باشد، اپ اندروید
نوار آدرس کروم را نمایش می‌دهد و دیگر شبیه یک اپلیکیشن بومی نیست.

## دو اثر انگشت لازم است

| کلید | از کجا بیاید |
| --- | --- |
| کلید آپلود (upload key) | `keytool -list -v -keystore android.keystore -alias afrat` |
| کلید امضای گوگل‌پلی | Play Console → Setup → App integrity → App signing key certificate |

اگر فقط اثر انگشت کلید آپلود را بگذارید، نسخهٔ نصب‌شده از گوگل‌پلی
اعتبارسنجی نمی‌شود، چون Play با کلید خودش دوباره امضا می‌کند. **هر دو** را
بگذارید. برای کافه‌بازار و مایکت که دوباره امضا نمی‌کنند، همان کلید آپلود کافی
است.

## بررسی

```bash
curl -s https://afrat.app/.well-known/assetlinks.json | jq .

# ابزار رسمی گوگل:
# https://developers.google.com/digital-asset-links/tools/generator
```

فایل باید با `Content-Type: application/json`، بدون ریدایرکت و روی HTTPS
سرو شود. هدرهای لازم در `apps/web/next.config.mjs` تنظیم شده‌اند.
