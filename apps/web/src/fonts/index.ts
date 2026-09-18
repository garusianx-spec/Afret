import localFont from 'next/font/local';

/**
 * IranYekan Web — the licensed brand typeface.
 *
 * Loaded through `next/font/local` rather than a hand-written `@font-face`
 * so Next emits a preload link, fingerprints the URL (immutable caching via
 * `/_next/static/media/`), and derives `size-adjust` metrics for the fallback
 * face — which is what keeps the layout from jumping when the real font
 * arrives on a slow connection.
 *
 * Three static weights were supplied (no variable axis), so the weights are
 * declared individually. `font-weight: 600` resolves to the 700 face; nothing
 * in the design system asks for a semibold.
 */
export const iranYekan = localFont({
  src: [
    { path: './IRANYekanWeb-Regular.woff2', weight: '400', style: 'normal' },
    { path: './IRANYekanWeb-Medium.woff2', weight: '500', style: 'normal' },
    { path: './IRANYekanWeb-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--afrat-font-sans',
  display: 'swap',
  // Persian text falls back to whatever the device has; Tahoma is the most
  // reliably present face with comparable Arabic-script metrics.
  fallback: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
  adjustFontFallback: false,
  preload: true,
});
