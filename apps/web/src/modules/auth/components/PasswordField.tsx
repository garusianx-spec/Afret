'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

import { scorePassword } from '../lib/mobile';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  autoComplete?: 'current-password' | 'new-password';
  error?: string;
  disabled?: boolean;
  /** Render the strength meter — registration only, not login. */
  showStrength?: boolean;
}

const METER_TONE = [
  'bg-coral',
  'bg-coral',
  'bg-amber-400',
  'bg-mint',
  'bg-mint',
] as const;

export function PasswordField({
  value,
  onChange,
  label = 'رمز عبور',
  autoComplete = 'current-password',
  error,
  disabled,
  showStrength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const strength = showStrength ? scorePassword(value) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">
        {label}
      </label>

      <div className="relative">
        <Lock
          className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-ink-faint"
          aria-hidden="true"
        />
        <input
          id={id}
          name={autoComplete === 'new-password' ? 'new-password' : 'password'}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          dir="ltr"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'w-full rounded-xl border bg-surface py-3 pe-10 ps-11 text-sm text-ink',
            'text-right placeholder:text-ink-faint focus:outline-none',
            error
              ? 'border-coral focus:border-coral'
              : 'border-surface-border focus:border-primary',
            disabled && 'opacity-60',
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // A password toggle is a convenience, not a form control — keeping
          // it out of the tab order stops it interrupting keyboard submit.
          tabIndex={-1}
          aria-label={visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
          className="absolute inset-y-0 start-2 my-auto flex size-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-border"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {strength && value.length > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-pill transition-colors',
                  i < strength.score ? METER_TONE[strength.score] : 'bg-surface-border',
                )}
              />
            ))}
          </div>
          <p className="text-[11px] text-ink-faint" aria-live="polite">
            قدرت رمز: {strength.label}
            {strength.hints.length > 0 ? ` — ${strength.hints.join('، ')}` : ''}
          </p>
        </div>
      ) : null}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}
