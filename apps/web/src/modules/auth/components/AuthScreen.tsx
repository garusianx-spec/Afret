'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

import { AuthError } from '../api/authApi';
import { useAuth } from '../AuthProvider';
import { isValidMobile, normalizeMobile, scorePassword } from '../lib/mobile';
import type { AuthMode } from '../types';

import { BrandLockup } from './BrandMark';
import { MobileField } from './MobileField';
import { PasswordField } from './PasswordField';

interface FieldErrors {
  mobile?: string;
  password?: string;
  fullName?: string;
}

export function AuthScreen({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Clear a field's error as soon as the user edits it. Leaving the previous
   * failure visible while they type the correction reads as "still wrong"
   * and is the most common complaint about validated forms.
   */
  const clearError = (field: keyof FieldErrors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
    // The password is not carried across modes: a value typed as "current"
    // should never silently become a "new" password.
    setPassword('');
  };

  function validate(): FieldErrors {
    const next: FieldErrors = {};

    if (!isValidMobile(mobile)) {
      next.mobile = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.';
    }
    if (mode !== 'forgot') {
      if (!password) {
        next.password = 'رمز عبور را وارد کنید.';
      } else if (mode === 'register' && scorePassword(password).score < 2) {
        next.password = 'رمز عبور باید حداقل ۸ نویسه و ترکیبی از حرف و عدد باشد.';
      }
    }
    if (mode === 'register' && fullName.trim() && fullName.trim().length < 2) {
      next.fullName = 'نام واردشده کوتاه است.';
    }
    return next;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const canonical = normalizeMobile(mobile)!;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ mobile: canonical, password });
      } else if (mode === 'register') {
        await register({
          mobile: canonical,
          password,
          fullName: fullName.trim() || undefined,
        });
      } else {
        // Password reset needs the SMS provider, which is pluggable but not
        // wired. Saying so plainly beats a form that silently does nothing.
        setFormError(
          'بازیابی رمز عبور از طریق پیامک هنوز فعال نشده است. برای کمک با پشتیبانی تماس بگیرید.',
        );
      }
    } catch (error) {
      setFormError(
        error instanceof AuthError
          ? error.message
          : 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const copy = {
    login: { title: 'خوش آمدید', subtitle: 'برای ادامه وارد حساب خود شوید.', cta: 'ورود' },
    register: { title: 'ساخت حساب', subtitle: 'همراه شما در هر مرحله از این مسیر.', cta: 'ثبت‌نام' },
    forgot: { title: 'بازیابی رمز عبور', subtitle: 'شمارهٔ موبایل خود را وارد کنید.', cta: 'ارسال کد بازیابی' },
  }[mode];

  return (
    <main className="flex min-h-[100dvh] flex-col bg-surface">
      <div className="afrat-safe-top mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <BrandLockup />
          <div>
            <h1 className="text-xl font-bold text-ink">{copy.title}</h1>
            <p className="mt-1 text-sm leading-7 text-ink-muted">{copy.subtitle}</p>
          </div>
        </div>

        {mode !== 'forgot' ? (
          <div
            role="tablist"
            aria-label="ورود یا ثبت‌نام"
            className="mb-6 flex rounded-pill bg-surface-card p-1 shadow-card"
          >
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                type="button"
                aria-selected={mode === tab}
                onClick={() => switchMode(tab)}
                className={cn(
                  'afrat-tap flex-1 rounded-pill py-2.5 text-sm font-bold transition',
                  mode === tab
                    ? 'bg-primary-deep text-white shadow-raised'
                    : 'text-ink-muted',
                )}
              >
                {tab === 'login' ? 'ورود' : 'ثبت‌نام'}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <MobileField
            value={mobile}
            onChange={(value) => {
              setMobile(value);
              clearError('mobile');
              setFormError(null);
            }}
            error={errors.mobile}
            disabled={submitting}
            autoFocus
          />

          {mode === 'register' ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="afrat-fullname" className="text-xs font-medium text-ink-muted">
                نام و نام خانوادگی <span className="text-ink-faint">(اختیاری)</span>
              </label>
              <input
                id="afrat-fullname"
                name="name"
                autoComplete="name"
                value={fullName}
                disabled={submitting}
                onChange={(event) => {
                  setFullName(event.target.value);
                  clearError('fullName');
                }}
                placeholder="مثلاً مریم رضایی"
                aria-invalid={Boolean(errors.fullName)}
                className={cn(
                  'w-full rounded-xl border bg-surface px-3 py-3 text-sm text-ink',
                  'placeholder:text-ink-faint focus:outline-none',
                  errors.fullName
                    ? 'border-coral focus:border-coral'
                    : 'border-surface-border focus:border-primary',
                )}
              />
              {errors.fullName ? (
                <p role="alert" className="text-xs text-coral">
                  {errors.fullName}
                </p>
              ) : null}
            </div>
          ) : null}

          {mode !== 'forgot' ? (
            <PasswordField
              value={password}
              onChange={(value) => {
                setPassword(value);
                clearError('password');
                setFormError(null);
              }}
              error={errors.password}
              disabled={submitting}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              showStrength={mode === 'register'}
            />
          ) : null}

          {formError ? (
            <p
              role="alert"
              className="rounded-xl bg-coral-soft px-3 py-2.5 text-xs leading-6 text-ink"
            >
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'afrat-tap mt-1 flex items-center justify-center gap-2 rounded-pill px-4 py-3.5',
              'bg-primary-deep text-sm font-bold text-white shadow-raised',
              'hover:bg-primary-deep/92 active:bg-primary-deep/85',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {submitting ? 'لطفاً صبر کنید…' : copy.cta}
          </button>

          <div className="flex items-center justify-between pt-1 text-xs">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="afrat-tap font-medium text-primary-deep"
              >
                رمز عبور را فراموش کرده‌اید؟
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="afrat-tap font-medium text-primary-deep"
              >
                بازگشت به ورود
              </button>
            )}
          </div>
        </form>

        {mode === 'register' ? (
          <p className="mt-6 text-center text-[11px] leading-6 text-ink-faint">
            با ثبت‌نام، <span className="text-ink-muted">شرایط استفاده</span> و{' '}
            <span className="text-ink-muted">سیاست حریم خصوصی</span> آفرت را
            می‌پذیرید.
          </p>
        ) : null}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          اطلاعات سلامت شما رمزگذاری‌شده و خصوصی نگهداری می‌شود.
        </p>
      </div>
    </main>
  );
}
