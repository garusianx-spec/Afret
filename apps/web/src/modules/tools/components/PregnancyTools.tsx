import { Droplets, Salad } from 'lucide-react';

import { BabyNameDirectory } from './BabyNameDirectory';
import { CordBloodGuide } from './CordBloodGuide';
import { InfoGuideCard } from './InfoGuideCard';
import { LinkCard } from './LinkCard';
import { MemoryAlbum } from '@/modules/profile/components/MemoryAlbum';
import { SoundPlayer } from '@/modules/profile/components/SoundPlayer';
import { ToolkitChecklist } from '@/modules/profile/components/ToolkitChecklist';
import { HOSPITAL_BAG, LAYETTE } from '@/modules/profile/data/checklists';

/** Mode C tools — pregnancy. */
export function PregnancyTools() {
  return (
    <>
      <LinkCard
        href="/nutrition"
        icon={Salad}
        title="رژیم اختصاصی بارداری و بانک سلامت خوراکی‌ها"
        subtitle="برنامهٔ غذایی و جستجوی ایمنی خوراکی‌ها — تب «تغذیه»"
      />
      <ToolkitChecklist listId="hospital-bag" title="چک‌لیست ساک بیمارستان" items={HOSPITAL_BAG} />
      <ToolkitChecklist listId="layette" title="برنامه‌ریز سیسمونی" items={LAYETTE} />
      <BabyNameDirectory />
      <SoundPlayer />
      <InfoGuideCard
        icon={Droplets}
        tone="mint"
        title="مراقبت‌های پوستی بارداری"
        body="مرطوب‌کننده‌های بدون عطر و ماساژ ملایم شکم می‌توانند از خارش و ترک پوستی بکاهند."
      />
      <CordBloodGuide />
    </>
  );
}
