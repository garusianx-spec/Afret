import type { LifecycleMode } from '@/types';

import { CycleTools } from './CycleTools';
import { PostpartumTools } from './PostpartumTools';
import { PregnancyTools } from './PregnancyTools';
import { TtcTools } from './TtcTools';

const TOOLS_BY_MODE: Record<LifecycleMode, () => React.JSX.Element> = {
  cycle: CycleTools,
  ttc: TtcTools,
  pregnancy: PregnancyTools,
  postpartum: PostpartumTools,
};

/**
 * The one place that decides which tools a mother sees.
 *
 * Content here is strictly filtered by mode — a hospital-bag checklist has
 * no business in front of someone tracking a regular cycle, and a fertility
 * diet guide is noise for someone who just had a baby. Each mode's set is a
 * dedicated component (`CycleTools`, `TtcTools`, ...) rather than one giant
 * component with conditionals, so adding a fifth mode later never means
 * re-reading this switch.
 */
export function ToolsSection({ mode }: { mode: LifecycleMode }) {
  const Tools = TOOLS_BY_MODE[mode];
  return <Tools />;
}
