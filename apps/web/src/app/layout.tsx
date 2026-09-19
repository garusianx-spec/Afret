import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { Metadata, Viewport } from 'next';

import { Providers } from '@/components/providers/Providers';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://afrat.app'),
  title: {
    default: 'آفرت | همراه سلامت مادر و کودک',
    template: '%s | آفرت',
  },
  description:
    'آفرت، همراه کامل شما از ردیابی قاعدگی و بارداری تا تغذیه، مراقبت از نوزاد و گفتگو با متخصصان.',
  applicationName: 'آفرت',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'آفرت',
    statusBarStyle: 'default',
  },
  formatDetection: {
    // Persian phone-like digit strings (e.g. gestational ranges) must not be
    // auto-linked into tel: links by iOS Safari.
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'آفرت',
    title: 'آفرت | همراه سلامت مادر و کودک',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#AA4C7A' },
    { media: '(prefers-color-scheme: dark)', color: '#AA4C7A' },
  ],
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom stays enabled — disabling it fails WCAG 1.4.4.
  maximumScale: 5,
  // Lets the app paint under the notch and the Android gesture bar; the
  // `afrat-safe-*` utilities put the padding back where it matters.
  viewportFit: 'cover',
};

/**
 * Preload only the weights that are actually on disk.
 *
 * The brand font is gitignored, so a fresh clone has none of these. An
 * unconditional preload would then fire a 404 on every page load and print a
 * console warning about an unused preload — noise that hides real problems.
 * This runs on the server at build time for the static routes.
 */
const PRELOADED_FONTS = ['IRANYekanWeb-Regular.woff2', 'IRANYekanWeb-Bold.woff2'].filter(
  (file) => existsSync(join(process.cwd(), 'public', 'fonts', file)),
);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa-IR" dir="rtl">
      <head>
        {PRELOADED_FONTS.map((file) => (
          <link
            key={file}
            rel="preload"
            href={`/fonts/${file}`}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
