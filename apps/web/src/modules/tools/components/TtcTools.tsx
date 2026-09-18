import { HeartHandshake } from 'lucide-react';

import { InfoGuideCard } from './InfoGuideCard';
import { OvulationKitTracker } from './OvulationKitTracker';
import { ToolkitChecklist } from '@/modules/profile/components/ToolkitChecklist';
import { FERTILITY_DIET_TIPS, PRECONCEPTION_CHECKLIST } from '../data/toolContent';

/** Mode B tools — trying to conceive. */
export function TtcTools() {
  return (
    <>
      <ToolkitChecklist
        listId="preconception"
        title="چک‌لیست آزمایش‌ها و چکاپ‌های پیش از بارداری"
        items={PRECONCEPTION_CHECKLIST}
      />
      <InfoGuideCard
        icon={HeartHandshake}
        tone="mint"
        title="تغذیهٔ تقویت باروری برای زوجین"
        body={FERTILITY_DIET_TIPS.join(' ')}
      />
      <OvulationKitTracker />
    </>
  );
}
