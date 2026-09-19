import { Syringe } from 'lucide-react';

import { AllergyTracker } from './AllergyTracker';
import { BabyNameDirectory } from './BabyNameDirectory';
import { LinkCard } from './LinkCard';
import { MilestoneMemories } from './MilestoneMemories';
import { ScreenFreePlayIdeas } from './ScreenFreePlayIdeas';
import { MemoryAlbum } from '@/modules/profile/components/MemoryAlbum';

/** Mode D tools — baby care & postpartum. */
export function PostpartumTools() {
  return (
    <>
      <LinkCard
        href="/tracker#vaccines"
        icon={Syringe}
        tone="coral"
        title="جدول و یادآور واکسیناسیون"
        subtitle="برنامهٔ کامل ایمن‌سازی — تب «تقویم»"
      />
      <MilestoneMemories />
      <AllergyTracker />
      <ScreenFreePlayIdeas />
      <MemoryAlbum />
      <BabyNameDirectory />
    </>
  );
}
