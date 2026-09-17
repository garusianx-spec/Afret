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
    { media: '(prefers-color-scheme: light)', color: '#F8F7FC' },
    { media: '(prefers-color-scheme: dark)', color: '#F8F7FC' },
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
