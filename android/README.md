# بسته‌بندی اندروید (TWA)

این پوشه پیکربندی Bubblewrap را نگه می‌دارد. راهنمای کامل گام‌به‌گام در
[`../docs/twa-android.md`](../docs/twa-android.md) است.

## فایل‌ها

| فایل | نقش |
| --- | --- |
| `twa-manifest.json` | پیکربندی Bubblewrap — از قبل با مقادیر آفرت پر شده |
| `android.keystore` | کلید امضا — **commit نمی‌شود** (`.gitignore`) |

## خلاصهٔ سریع

```bash
npm install -g @bubblewrap/cli
bubblewrap doctor

# یک‌بار: ساخت کلید آپلود
keytool -genkeypair -v -keystore android.keystore \
  -alias afrat -keyalg RSA -keysize 2048 -validity 10000

bubblewrap init --manifest https://afrat.app/manifest.webmanifest --directory .
bubblewrap build
```

## پیش از انتشار: assetlinks

اثر انگشت SHA-256 کلید آپلود **و** کلید Play App Signing را در
`apps/web/public/.well-known/assetlinks.json` بگذارید، سپس PWA را دوباره
منتشر کنید.

اگر این کار انجام نشود، اپ با نوار آدرس کروم باز می‌شود. جزئیات و عیب‌یابی در
سند اصلی.
