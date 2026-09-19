import { z } from 'zod';

import { gdmRisk, preeclampsiaRisk, worstTier, type RiskTier } from './clinical-thresholds.js';

/**
 * The clinical-sync payload: what a mother's device may send once she has
 * explicitly opted in. Nothing else about her health ever leaves the
 * device — no mood, symptoms, BBT, or cervical-mucus logs.
 *
 * `max(20)` on readings is data minimization by construction: the payload
 * physically cannot smuggle a full history, only a recent snapshot.
 */
export const clinicalReadingSchema = z
  .object({
    at: z.string().datetime(),
    systolic: z.number().int().min(50).max(260).optional(),
    diastolic: z.number().int().min(30).max(180).optional(),
    glucose: z.number().int().min(20).max(500).optional(),
    glucoseContext: z.enum(['fasting', 'oneHour', 'twoHour']).optional(),
    weightKg: z.number().positive().max(300).optional(),
  })
  .refine(
    (r) => r.systolic != null || r.glucose != null || r.weightKg != null,
    'هر مورد باید حداقل یک مقدار داشته باشد.',
  );

export const clinicalSyncPayloadSchema = z.object({
  readings: z.array(clinicalReadingSchema).max(20),
});

export type ClinicalReading = z.infer<typeof clinicalReadingSchema>;
export type ClinicalSyncPayload = z.infer<typeof clinicalSyncPayloadSchema>;

export interface ClinicalAlert {
  at: string;
  kind: 'bloodPressure' | 'glucose';
  tier: RiskTier;
  detail: string;
}

/** Doctor-facing summary: the worst tier overall, plus each concerning reading. */
export function summarizeClinicalAlerts(readings: ClinicalReading[]): {
  overallTier: RiskTier;
  alerts: ClinicalAlert[];
} {
  const alerts: ClinicalAlert[] = [];

  for (const r of readings) {
    if (r.systolic != null && r.diastolic != null) {
      const tier = preeclampsiaRisk(r.systolic, r.diastolic);
      if (tier !== 'normal') {
        alerts.push({
          at: r.at,
          kind: 'bloodPressure',
          tier,
          detail: `${r.systolic}/${r.diastolic}`,
        });
      }
    }
    if (r.glucose != null && r.glucoseContext) {
      const tier = gdmRisk(r.glucose, r.glucoseContext);
      if (tier !== 'normal') {
        alerts.push({ at: r.at, kind: 'glucose', tier, detail: String(r.glucose) });
      }
    }
  }

  return { overallTier: worstTier(alerts.map((a) => a.tier)), alerts };
}
