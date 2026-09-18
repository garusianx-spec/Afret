import { Salad } from 'lucide-react';

import { ArticleList } from './ArticleList';
import { InfoGuideCard } from './InfoGuideCard';
import { PillReminder } from './PillReminder';
import { WeightBmiTracker } from './WeightBmiTracker';
import { SELF_CARE_ARTICLES } from '../data/toolContent';

/**
 * Mode A tools — general cycle tracking. No fetal content, no hospital bag,
 * no lullabies: this mother is not pregnant, and content that assumes she is
 * would be a real mismatch, not a harmless extra.
 */
export function CycleTools() {
  return (
    <>
      <InfoGuideCard
        icon={Salad}
        title="راهنمای تغذیه و تسکین دردهای قاعدگی"
        body="منیزیم (کدو تنبل، بادام)، امگا-۳ و آهن به کاهش گرفتگی و تعادل هورمونی کمک می‌کنند. کافئین و نمک زیاد می‌توانند نفخ و درد را تشدید کنند."
      />
      <PillReminder />
      <ArticleList title="مقالات سلامت زنان و خودمراقبتی" articles={SELF_CARE_ARTICLES} />
      <WeightBmiTracker />
    </>
  );
}
