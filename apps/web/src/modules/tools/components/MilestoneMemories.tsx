import { Footprints, MessageCircle, Smile, Sparkles } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';

import type { MilestoneKind } from '../store/milestoneMemoryStore';
import { MilestoneRow } from './milestones/MilestoneRow';

const MILESTONES: { kind: MilestoneKind; label: string; icon: typeof Smile }[] = [
  { kind: 'firstSmile', label: 'اولین لبخند', icon: Smile },
  { kind: 'firstTooth', label: 'اولین دندان', icon: Sparkles },
  { kind: 'firstWord', label: 'اولین کلمه', icon: MessageCircle },
  { kind: 'firstSteps', label: 'اولین قدم‌ها', icon: Footprints },
];

/**
 * Mode D — "اولین‌های نوزاد". A fixed set of once-in-a-lifetime moments,
 * distinct from the free-form `MemoryAlbum`: each has its own date, note,
 * and photo placeholder, always in the same order so nothing gets missed.
 */
export function MilestoneMemories() {
  return (
    <Card>
      <CardTitle>اولین‌های نوزاد</CardTitle>
      <ul className="flex flex-col gap-2">
        {MILESTONES.map((m) => (
          <MilestoneRow key={m.kind} kind={m.kind} label={m.label} icon={m.icon} />
        ))}
      </ul>
    </Card>
  );
}
