/** The lifecycle stage the app is currently tailored to. */
export type LifecycleMode =
  | 'cycle' // پریود و چرخه قاعدگی
  | 'ttc' // در تلاش برای بارداری
  | 'pregnancy' // بارداری
  | 'postpartum'; // پس از زایمان و مراقبت از نوزاد

export const LIFECYCLE_LABELS: Record<LifecycleMode, string> = {
  cycle: 'ردیابی قاعدگی',
  ttc: 'در تلاش برای بارداری',
  pregnancy: 'بارداری',
  postpartum: 'مراقبت از نوزاد',
};

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  mode: LifecycleMode;

  /** Last menstrual period — the LMP baseline for gestational age. */
  lmpDate?: string; // ISO date
  /** Average cycle length in days (default 28). */
  cycleLength: number;
  /** Average bleeding duration in days (default 5). */
  periodLength: number;

  /**
   * Clinician override. When present it wins over the LMP calculation —
   * a dating ultrasound or NT scan is more accurate than a remembered LMP.
   */
  gestationalOverride?: GestationalOverride;

  /** Expected/actual delivery date, ISO. */
  dueDate?: string;

  baby?: BabyProfile;
}

export interface GestationalOverride {
  /** Date the measurement was taken. */
  measuredOn: string; // ISO date
  /** Gestational age at that moment. */
  weeks: number;
  days: number;
  source: 'ultrasound' | 'nt' | 'ivf' | 'clinician';
  note?: string;
}

export interface BabyProfile {
  name: string;
  birthDate: string; // ISO date
  sex?: 'female' | 'male' | 'unknown';
  birthWeightKg?: number;
}
