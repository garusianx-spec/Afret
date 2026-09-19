import { SectionTitle } from '@/components/ui';
import { GestationOverrideCard } from '@/modules/tracker/components/GestationOverrideCard';
import {
  BloodPressureLogger,
  GlucoseLogger,
  MoodAndNauseaLogger,
  WeightLogger,
} from '@/modules/tracker/components/HealthLoggers';
import { KickCounter } from '@/modules/tracker/components/FertilityLoggers';
import { ShareVitalsToggle } from '@/modules/tracker/components/ShareVitalsToggle';

/**
 * Mode C — بارداری: سن بارداری (LMP یا سونوگرافی)، قند خون، فشار خون، وزن،
 * شمارش حرکات جنین.
 */
export function PregnancyTrackerContent() {
  return (
    <>
      <GestationOverrideCard />

      <SectionTitle>ثبت روزانه</SectionTitle>
      <WeightLogger />
      <GlucoseLogger />
      <BloodPressureLogger />
      <MoodAndNauseaLogger />
      <KickCounter />

      <ShareVitalsToggle />
    </>
  );
}
