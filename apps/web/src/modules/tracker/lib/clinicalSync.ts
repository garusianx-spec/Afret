import type { ClinicalReading, GlucoseContext } from '@afrat/core';

import type { HealthLog } from '../store/healthLogStore';

const SYNCED_KINDS = new Set<HealthLog['kind']>(['weight', 'glucose', 'bloodPressure']);

/** Recent BP / glucose / weight only — never mood, symptoms, BBT, or mucus. */
export function toClinicalReadings(logs: HealthLog[], limit = 15): ClinicalReading[] {
  return logs
    .filter((log) => SYNCED_KINDS.has(log.kind))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit)
    .map((log): ClinicalReading => {
      if (log.kind === 'weight') return { at: log.at, weightKg: log.value };
      if (log.kind === 'glucose') {
        return {
          at: log.at,
          glucose: log.value,
          glucoseContext: (log.label as GlucoseContext | undefined) ?? 'fasting',
        };
      }
      return { at: log.at, systolic: log.value, diastolic: log.value2 };
    });
}
