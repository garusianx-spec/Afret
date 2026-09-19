import { toFaDigits } from '@/lib/persian';
import { monthsSinceBirth, whoPercentileBand, whoPercentileForReading, type ChartableGrowthKind } from '../../lib/growthPercentile';
import type { GrowthLog } from '../../store/babyGrowthStore';
import { PercentileChart, type BandSample } from './PercentileChart';

const SAMPLE_COUNT = 13;

/**
 * Wraps `PercentileChart` with real WHO-derived data: samples the P3–P97
 * envelope across the visible age range, and plots each reading at its true
 * elapsed age since birth (not spread out evenly across the axis).
 */
export function WhoGrowthPanel({
  kind,
  logs,
  birthDate,
  sex,
  currentAgeMonths,
}: {
  kind: ChartableGrowthKind;
  logs: GrowthLog[];
  birthDate: string;
  sex: 'male' | 'female' | 'unknown' | undefined;
  currentAgeMonths: number;
}) {
  const maxMonths = Math.min(24, Math.max(currentAgeMonths + 2, 6));

  const band: BandSample[] = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
    const months = (i / (SAMPLE_COUNT - 1)) * maxMonths;
    return { months, ...whoPercentileBand(kind, sex, months) };
  });

  const points = logs.map((log) => ({
    months: monthsSinceBirth(birthDate, log.at),
    value: log.value,
  }));

  const latest = logs[logs.length - 1];
  const latestPercentile = latest
    ? whoPercentileForReading(kind, sex, monthsSinceBirth(birthDate, latest.at), latest.value)
    : null;

  return (
    <>
      <PercentileChart
        band={band}
        points={points}
        maxMonths={maxMonths}
        ariaLabel={kind === 'weight' ? 'نمودار صدک وزن به سن' : 'نمودار صدک قد به سن'}
      />
      {latestPercentile != null ? (
        <p className="mb-2 text-center text-xs text-ink-muted">
          آخرین اندازه‌گیری در حدود صدک {toFaDigits(Math.round(latestPercentile))} استاندارد رشد
          سازمان جهانی بهداشت است.
        </p>
      ) : null}
    </>
  );
}
