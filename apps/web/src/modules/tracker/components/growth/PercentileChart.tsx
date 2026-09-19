import { toFaDigits } from '@/lib/persian';

export interface ChartPoint {
  months: number;
  value: number;
}

export interface BandSample {
  months: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

/**
 * Pure SVG renderer for a WHO percentile chart: P3–P97 as a soft envelope,
 * P15–P85 as a firmer band, P50 as a dashed median, and the baby's own
 * readings plotted at their real elapsed age — not spread out evenly.
 */
export function PercentileChart({
  band,
  points,
  maxMonths,
  ariaLabel,
}: {
  band: BandSample[];
  points: ChartPoint[];
  maxMonths: number;
  ariaLabel: string;
}) {
  const W = 300;
  const H = 160;
  const pad = 10;

  const allY = [
    ...band.flatMap((b) => [b.p3, b.p97]),
    ...points.map((p) => p.value),
  ];
  const yMin = Math.min(...allY) * 0.95;
  const yMax = Math.max(...allY) * 1.05;

  const xFor = (m: number) => pad + (m / maxMonths) * (W - pad * 2);
  const yFor = (v: number) => H - pad - ((v - yMin) / (yMax - yMin)) * (H - pad * 2);

  const path = (key: 'p3' | 'p15' | 'p50' | 'p85' | 'p97') =>
    band.map((b) => `${xFor(b.months)},${yFor(b[key])}`).join(' ');

  const outerEnvelope = `${path('p3')} ${band
    .slice()
    .reverse()
    .map((b) => `${xFor(b.months)},${yFor(b.p97)}`)
    .join(' ')}`;
  const innerBand = `${path('p15')} ${band
    .slice()
    .reverse()
    .map((b) => `${xFor(b.months)},${yFor(b.p85)}`)
    .join(' ')}`;

  return (
    <div className="mb-2 overflow-hidden rounded-xl bg-surface p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel}>
        <polygon points={outerEnvelope} className="fill-mint-soft/60" />
        <polygon points={innerBand} className="fill-mint-soft" />
        <polyline
          points={path('p50')}
          fill="none"
          className="stroke-ink-faint"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        {points.length > 1 ? (
          <polyline
            points={points.map((p) => `${xFor(p.months)},${yFor(p.value)}`).join(' ')}
            fill="none"
            className="stroke-primary-deep"
            strokeWidth={2}
          />
        ) : null}
        {points.map((p, i) => (
          <circle key={i} cx={xFor(p.months)} cy={yFor(p.value)} r={3} className="fill-primary-deep" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>تولد</span>
        <span>{toFaDigits(Math.round(maxMonths))} ماهگی</span>
      </div>
    </div>
  );
}
