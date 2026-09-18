import type { Config } from 'tailwindcss';

/**
 * Afrat design system.
 *
 * Every colour below is a CSS custom property declared in `globals.css` so the
 * same token can be read from plain CSS, from the `theme-color` meta tag and
 * from the service worker's offline shell without duplicating hex values.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Soft Lavender Violet — primary accent.
        primary: {
          DEFAULT: 'rgb(var(--afrat-primary) / <alpha-value>)',
          50: 'rgb(var(--afrat-primary-50) / <alpha-value>)',
          100: 'rgb(var(--afrat-primary-100) / <alpha-value>)',
          200: 'rgb(var(--afrat-primary-200) / <alpha-value>)',
          deep: 'rgb(var(--afrat-primary-deep) / <alpha-value>)',
        },
        // Soft Coral/Peach — warnings and pregnancy highlights.
        coral: {
          DEFAULT: 'rgb(var(--afrat-coral) / <alpha-value>)',
          soft: 'rgb(var(--afrat-coral-soft) / <alpha-value>)',
        },
        // Mint — successes, checklists, safe milestones.
        mint: {
          DEFAULT: 'rgb(var(--afrat-mint) / <alpha-value>)',
          soft: 'rgb(var(--afrat-mint-soft) / <alpha-value>)',
        },
        // The logo's plum. Used by the brand mark only.
        brand: 'rgb(var(--afrat-brand) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--afrat-surface) / <alpha-value>)',
          card: 'rgb(var(--afrat-surface-card) / <alpha-value>)',
          border: 'rgb(var(--afrat-surface-border) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--afrat-ink) / <alpha-value>)',
          muted: 'rgb(var(--afrat-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--afrat-ink-faint) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--afrat-font-sans)'],
      },
      borderRadius: {
        card: '1.25rem',
        bubble: '1.375rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgb(122 54 217 / 0.06), 0 8px 24px -12px rgb(122 54 217 / 0.12)',
        raised: '0 4px 16px -4px rgb(122 54 217 / 0.14)',
        nav: '0 -2px 20px -8px rgb(45 43 63 / 0.16)',
      },
      spacing: {
        // Notches, Android gesture bars and the persistent tab bar.
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        navbar: '4.25rem',
      },
      keyframes: {
        'typing-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-3px)', opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'typing-dot': 'typing-dot 1.2s infinite ease-in-out',
        'fade-up': 'fade-up 220ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
