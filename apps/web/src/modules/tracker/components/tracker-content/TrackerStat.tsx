export function TrackerStat({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <dt className="text-[11px] text-ink-muted">{term}</dt>
      <dd className="mt-0.5 text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}
