import type { RecentAnalyticsRecord } from "@/types/recent-analytics";

function medianStep(values: number[]): number {
  if (values.length < 2) return values[0] ?? 1;
  const steps: number[] = [];
  for (let i = 1; i < values.length; i++) {
    steps.push(Math.abs(values[i] - values[i - 1]));
  }
  const sorted = [...steps].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid] ?? 1;
}

function blendValue(current: number, target: number, weight: number): number {
  return current * (1 - weight) + target * weight;
}

function smoothMetricSeries(
  records: RecentAnalyticsRecord[],
  getValue: (r: RecentAnalyticsRecord) => number,
  setValue: (r: RecentAnalyticsRecord, v: number) => RecentAnalyticsRecord,
  roundInt = false
): RecentAnalyticsRecord[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map(getValue);
  const medStep = Math.max(medianStep(values), 0.01);
  const threshold = medStep * 2.5;

  const next = sorted.map((r) => ({ ...r }));
  const vals = next.map(getValue);

  for (let i = 1; i < vals.length - 1; i++) {
    const delta = Math.abs(vals[i] - vals[i - 1]);
    if (delta > threshold) {
      const mid = (vals[i - 1] + vals[i + 1]) / 2;
      vals[i] = blendValue(vals[i], mid, 0.45);
      if (i > 1) {
        vals[i - 1] = blendValue(vals[i - 1], (vals[i - 2] + vals[i]) / 2, 0.25);
      }
      if (i < vals.length - 2) {
        vals[i + 1] = blendValue(vals[i + 1], (vals[i] + vals[i + 2]) / 2, 0.25);
      }
    }
  }

  const boundaryBlendDays = Math.min(5, Math.floor(vals.length / 4));
  for (let i = 0; i < boundaryBlendDays && i < vals.length - 1; i++) {
    const w = 0.35 * (1 - i / boundaryBlendDays);
    vals[i] = blendValue(vals[i], vals[i + 1], w);
  }
  for (
    let i = vals.length - 1;
    i >= vals.length - boundaryBlendDays && i > 0;
    i--
  ) {
    const w = 0.35 * (1 - (vals.length - 1 - i) / boundaryBlendDays);
    vals[i] = blendValue(vals[i], vals[i - 1], w);
  }

  return next.map((r, i) => {
    let v = Math.round(vals[i] * 100) / 100;
    if (roundInt) v = Math.max(0, Math.round(v));
    return setValue(r, v);
  });
}

export function interpolateRecentEdits(
  records: RecentAnalyticsRecord[]
): RecentAnalyticsRecord[] {
  if (records.length < 3) return records;

  const bySales = smoothMetricSeries(
    records,
    (r) => r.totalSales,
    (r, v) => ({ ...r, totalSales: v })
  );

  return smoothMetricSeries(
    bySales,
    (r) => r.unitsSold,
    (r, v) => ({ ...r, unitsSold: v }),
    true
  );
}
