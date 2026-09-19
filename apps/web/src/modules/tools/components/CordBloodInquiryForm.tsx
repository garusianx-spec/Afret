'use client';

import { useState } from 'react';

import { Card, CardTitle } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';

import { useCordBloodDraftStore } from '../store/cordBloodStore';

const inputClass =
  'w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none';

/**
 * A private draft, not a submission — there is no cord-blood-bank partner
 * wired into this app to send it to. Saving just keeps her notes ready for
 * the call she makes herself.
 */
export function CordBloodInquiryForm() {
  const draft = useCordBloodDraftStore();
  const [bankName, setBankName] = useState(draft.bankName);
  const [contactPreference, setContactPreference] = useState(draft.contactPreference);
  const [notes, setNotes] = useState(draft.notes);

  return (
    <Card>
      <CardTitle>یادداشت تماس با بانک خون بند ناف</CardTitle>
      <p className="mb-3 text-xs leading-6 text-ink-muted">
        این فقط یادداشت شخصی شماست و برای هیچ مرکزی ارسال نمی‌شود — برای وقتی
        که خودتان تماس می‌گیرید.
      </p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          draft.save({ bankName, contactPreference, notes });
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">نام بانک یا مرکز</span>
          <input
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            placeholder="مثلاً بانک سلول‌های بنیادی رویان"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">روش تماس ترجیحی</span>
          <input
            value={contactPreference}
            onChange={(event) => setContactPreference(event.target.value)}
            placeholder="مثلاً تماس تلفنی صبح‌ها"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">سوالات یا یادداشت</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="مثلاً هزینهٔ سالانهٔ نگهداری چقدر است؟"
            className={`${inputClass} resize-none`}
          />
        </label>

        <button
          type="submit"
          className="afrat-tap rounded-pill bg-primary-deep py-3 text-sm font-bold text-white"
        >
          ذخیرهٔ یادداشت
        </button>

        {draft.savedAt ? (
          <p className="text-center text-[11px] text-ink-faint">
            آخرین ذخیره: {jalaliShort(draft.savedAt)}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
