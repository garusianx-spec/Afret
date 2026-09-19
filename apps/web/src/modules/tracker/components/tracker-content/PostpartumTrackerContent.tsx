'use client';

import { BabyProfileForm } from '@/modules/tracker/components/BabyProfileForm';
import { GrowthChart } from '@/modules/tracker/components/GrowthChart';
import { MilestoneList, VaccineSchedule } from '@/modules/tracker/components/VaccineSchedule';
import { useUserStore } from '@/stores/userStore';

/** Mode D — والدگری و نوزاد: نمودار رشد (صدک WHO)، برنامهٔ واکسیناسیون. */
export function PostpartumTrackerContent() {
  const baby = useUserStore((s) => s.profile?.baby);

  if (!baby) return <BabyProfileForm />;

  return (
    <>
      <GrowthChart baby={baby} />
      <VaccineSchedule baby={baby} />
      <MilestoneList baby={baby} />
    </>
  );
}
