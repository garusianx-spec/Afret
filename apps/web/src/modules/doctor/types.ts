export type JourneyMode = 'cycle' | 'ttc' | 'pregnancy' | 'postpartum';
export type RiskFlag = 'normal' | 'watch' | 'urgent';

export const JOURNEY_LABELS: Record<JourneyMode, string> = {
  cycle: 'ردیابی قاعدگی',
  ttc: 'تلاش برای بارداری',
  pregnancy: 'بارداری',
  postpartum: 'مراقبت از نوزاد',
};

export const RISK_FLAG_LABELS: Record<RiskFlag, string> = {
  normal: 'عادی',
  watch: 'نیاز به پیگیری',
  urgent: 'فوری',
};

export interface DoctorPatient {
  id: string;
  displayName: string;
  roomId: string;
  journeyMode?: JourneyMode;
  journeyWeek?: number;
  riskFlag: RiskFlag;
  riskFlagNote?: string;
  lastMessage?: { id: string; body: string; createdAt: string; authorId: string; kind: string };
  unreadCount: number;
}
