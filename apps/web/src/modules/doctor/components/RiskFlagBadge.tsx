import { AlertTriangle, CheckCircle2, Eye } from 'lucide-react';

import { Chip } from '@/components/ui';

import { RISK_FLAG_LABELS, type RiskFlag } from '../types';

const TONE: Record<RiskFlag, 'mint' | 'coral' | 'primary'> = {
  normal: 'mint',
  watch: 'primary',
  urgent: 'coral',
};

const ICON: Record<RiskFlag, typeof CheckCircle2> = {
  normal: CheckCircle2,
  watch: Eye,
  urgent: AlertTriangle,
};

export function RiskFlagBadge({ flag }: { flag: RiskFlag }) {
  const Icon = ICON[flag];
  return (
    <Chip tone={TONE[flag]}>
      <Icon className="size-3.5" aria-hidden="true" />
      {RISK_FLAG_LABELS[flag]}
    </Chip>
  );
}
