'use client';

import { forwardRef } from 'react';
import { Smartphone } from 'lucide-react';

import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

interface MobileFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Mobile number input.
 *
 * `inputMode="tel"` brings up the numeric keypad, but the field still accepts
 * Persian digits because that is what a Persian keyboard produces — the value
 * is normalised on submit rather than fought with on every keystroke.
 *
 * `dir="ltr"` with `text-right` is deliberate: a phone number reads
 * left-to-right even inside an RTL page, but it should still sit against the
 * start edge of the field.
 */
export const MobileField = forwardRef<HTMLInputElement, MobileFieldProps>(
  function MobileField({ value, onChange, error, disabled, autoFocus }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor="afrat-mobile" className="text-xs font-medium text-ink-muted">
          شمارهٔ موبایل
        </label>

        <div className="relative">
          <Smartphone
            className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-ink-faint"
            aria-hidden="true"
          />
          <input
            ref={ref}
            id="afrat-mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            autoFocus={autoFocus}
            disabled={disabled}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'afrat-mobile-error' : undefined}
            className={cn(
              'w-full rounded-xl border bg-surface py-3 pe-10 ps-3 text-sm tabular-nums text-ink',
              'text-right placeholder:text-ink-faint focus:outline-none',
              error
                ? 'border-coral focus:border-coral'
                : 'border-surface-border focus:border-primary',
              disabled && 'opacity-60',
            )}
          />
        </div>

        {error ? (
          <p id="afrat-mobile-error" role="alert" className="text-xs text-coral">
            {error}
          </p>
        ) : (
          <p className="text-[11px] text-ink-faint">
            مثال: {toFaDigits('09123456789')}
          </p>
        )}
      </div>
    );
  },
);
