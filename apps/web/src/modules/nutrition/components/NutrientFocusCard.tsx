import { Card, CardTitle, Chip } from '@/components/ui';
import { toFaDigits } from '@/lib/persian';

import { nutrientFocusForWeek } from '../data/nutrientFocus';

export function NutrientFocusCard({ week }: { week: number }) {
  const focus = nutrientFocusForWeek(week);

  return (
    <Card>
      <CardTitle
        action={<Chip tone="primary">هفتهٔ {toFaDigits(week)}</Chip>}
      >
        {focus.headline}
      </CardTitle>

      <ul className="flex flex-col gap-3">
        {focus.nutrients.map((nutrient) => (
          <li key={nutrient.name} className="rounded-xl bg-surface p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-ink">{nutrient.name}</h3>
              <span className="shrink-0 text-[11px] font-medium text-primary-deep">
                {nutrient.amount}
              </span>
            </div>
            <p className="mt-1 text-xs leading-6 text-ink-muted">{nutrient.why}</p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {nutrient.sources.map((source) => (
                <li key={source}>
                  <Chip tone="mint">{source}</Chip>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}
