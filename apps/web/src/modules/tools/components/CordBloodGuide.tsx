import { Info } from 'lucide-react';

import { ToolkitChecklist } from '@/modules/profile/components/ToolkitChecklist';

import { CORD_BLOOD_CONTRAINDICATIONS, CORD_BLOOD_ELIGIBILITY } from '../data/toolContent';
import { CordBloodInquiryForm } from './CordBloodInquiryForm';
import { InfoGuideCard } from './InfoGuideCard';

/**
 * Mode C — cord-blood banking. General screening categories every bank
 * checks, not a stand-in for any one provider's protocol; every list item
 * says so, and the disclaimer below repeats it once more explicitly.
 */
export function CordBloodGuide() {
  return (
    <>
      <ToolkitChecklist
        listId="cord-blood-eligibility"
        title="معیارهای عمومی پذیرش"
        items={CORD_BLOOD_ELIGIBILITY}
      />
      <ToolkitChecklist
        listId="cord-blood-contraindications"
        title="شرایط و سوابق محدودکننده"
        items={CORD_BLOOD_CONTRAINDICATIONS}
      />
      <InfoGuideCard
        icon={Info}
        title="این فهرست، جایگزین مشاوره نیست"
        body="معیار دقیق پذیرش، هزینه و نحوهٔ جمع‌آوری در هر بانک خون بند ناف متفاوت است. پیش از هفتهٔ ۳۴ بارداری با مرکز موردنظرتان و پزشک خود مشورت کنید."
      />
      <CordBloodInquiryForm />
    </>
  );
}
