import { mulberry32 } from "@/mock-data/generators/random";
import type { DailyMetricPoint } from "@/mock-data/generators/time-series";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function indicesInProgressRange(
  dayCount: number,
  startProgress: number,
  endProgress: number
): number[] {
  const start = Math.floor(dayCount * startProgress);
  const end = Math.min(dayCount - 1, Math.floor(dayCount * endProgress));
  const indices: number[] = [];
  for (let i = start; i <= end; i++) indices.push(i);
  return indices;
}

/** Jagged bursts: early twin peaks → lull → Sep spike → late volatile run */
function jaggedBaseline(progress: number): number {
  const t = clamp(progress, 0, 1);

  if (t < 0.12) {
    return 0.35 + 0.12 * Math.sin(t * 55);
  }
  if (t < 0.48) {
    const mid = (t - 0.12) / 0.36;
    return 0.28 - mid * 0.18 + 0.06 * Math.sin(mid * Math.PI * 10);
  }
  if (t < 0.64) {
    return 0.04 + 0.02 * Math.sin(t * 80);
  }
  if (t < 0.68) {
    return 0.06 + (t - 0.64) * 2.5;
  }
  if (t < 0.8) {
    const lull = (t - 0.68) / 0.12;
    return 0.16 - lull * 0.12;
  }
  const late = (t - 0.8) / 0.2;
  return 0.08 + late * 0.28 + 0.1 * Math.sin(late * Math.PI * 14);
}

const RAW_BASE_GMV = 95;

export interface GenerateWalmartSecondOptions {
  startDate: string;
  endDate: string;
  seed?: number;
  targetGmv?: number;
}

export function generateWalmartSecondSeries(
  options: GenerateWalmartSecondOptions
): DailyMetricPoint[] {
  const rand = mulberry32((options.seed ?? 42) + 11);
  const start = new Date(options.startDate);
  const end = new Date(options.endDate);

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const dayCount = dates.length;
  if (dayCount === 0) return [];

  const rawGmvs: number[] = [];

  for (let i = 0; i < dayCount; i++) {
    const progress = dayCount > 1 ? i / (dayCount - 1) : 0;
    const baseline = jaggedBaseline(progress);

    const jitter = (rand() - 0.5) * 0.55;
    const weekly = 1 + 0.12 * Math.sin((i / 7) * Math.PI * 2);
    let spikeMultiplier = 1;

    if (progress < 0.12 && rand() > 0.82) {
      spikeMultiplier = 2.2 + rand() * 1.4;
    }
    if (progress >= 0.12 && progress < 0.48 && rand() > 0.78) {
      spikeMultiplier = 1.2 + rand() * 0.7;
    }
    if (progress >= 0.8 && rand() > 0.45) {
      spikeMultiplier = 1.35 + rand() * 1.1;
    }

    let raw = RAW_BASE_GMV * baseline * spikeMultiplier * weekly * (1 + jitter);
    if (progress >= 0.48 && progress < 0.64 && rand() > 0.92) {
      raw = -40 - rand() * 90;
    }

    rawGmvs.push(Math.round(raw * 100) / 100);
  }

  const targetGmv = options.targetGmv;
  let scaledGmvs: number[];

  if (targetGmv && targetGmv > 0) {
    const rawSum = rawGmvs.reduce((s, v) => s + v, 0);
    const scale = rawSum > 0 ? targetGmv / rawSum : 1;
    scaledGmvs = rawGmvs.map((g) => Math.round(g * scale * 100) / 100);

    const earlyPool = indicesInProgressRange(dayCount, 0.02, 0.1);
    earlyPool.sort((a, b) => scaledGmvs[b] - scaledGmvs[a]);
    const topEarlyDays = earlyPool.slice(0, 3);

    const sepPool = indicesInProgressRange(dayCount, 0.64, 0.68);
    sepPool.sort((a, b) => scaledGmvs[b] - scaledGmvs[a]);
    const topSepDay = sepPool.slice(0, 1);

    const latePool = indicesInProgressRange(dayCount, 0.8, 0.98).filter(
      (i) => i < dayCount - 5
    );
    latePool.sort((a, b) => scaledGmvs[b] - scaledGmvs[a]);
    const topLateDays = latePool.slice(0, 15);

    const flatPool = indicesInProgressRange(dayCount, 0.5, 0.64);
    const flatIndices = flatPool.filter((i) => !topEarlyDays.includes(i));

    const shapedIndices = new Set([
      ...topEarlyDays,
      ...topSepDay,
      ...topLateDays,
    ]);

    topEarlyDays.forEach((idx, n) => {
      const target = n === 0 ? 1480 : n === 1 ? 1420 : 520;
      const wobble = Math.round((rand() - 0.5) * 60);
      scaledGmvs[idx] = target + wobble;
    });

    topSepDay.forEach((idx) => {
      const wobble = Math.round((rand() - 0.5) * 80);
      scaledGmvs[idx] = 1180 + wobble;
    });

    topLateDays.forEach((idx) => {
      const wobble = Math.round((rand() - 0.5) * 120);
      scaledGmvs[idx] = 520 + rand() * 420 + wobble;
    });

    // Leave the final 5 days unshaped here — applyTrailingFiveDayGrowthWalmart
    // shapes them with natural variation instead of a flat ceiling.

    flatIndices.forEach((idx) => {
      if (shapedIndices.has(idx)) return;
      scaledGmvs[idx] =
        rand() > 0.88 ? -(20 + Math.floor(rand() * 80)) : Math.floor(rand() * 30);
    });

    const shapedBudget = [...shapedIndices].reduce((s, i) => s + scaledGmvs[i], 0);
    const flatBudget = flatIndices.reduce((s, i) => s + scaledGmvs[i], 0);
    const bodyIndices = scaledGmvs
      .map((_, i) => i)
      .filter((i) => !shapedIndices.has(i) && !flatIndices.includes(i));
    const bodyRawSum = bodyIndices.reduce((s, i) => s + scaledGmvs[i], 0);
    const bodyBudget = Math.max(0, targetGmv - shapedBudget - flatBudget);

    if (bodyIndices.length > 0 && bodyRawSum > 0) {
      const bodyScale = bodyBudget / bodyRawSum;
      bodyIndices.forEach((idx) => {
        scaledGmvs[idx] = Math.round(scaledGmvs[idx] * bodyScale * 100) / 100;
      });
    }

    let drift = Math.round((targetGmv - scaledGmvs.reduce((s, v) => s + v, 0)) * 100) / 100;
    const driftPool = bodyIndices.length > 0 ? bodyIndices : topLateDays;
    let cursor = 0;
    while (drift !== 0 && driftPool.length > 0 && cursor < driftPool.length * 4) {
      const idx = driftPool[cursor % driftPool.length];
      const next = scaledGmvs[idx] + drift;
      scaledGmvs[idx] = Math.round(next * 100) / 100;
      drift = Math.round((targetGmv - scaledGmvs.reduce((s, v) => s + v, 0)) * 100) / 100;
      cursor += 1;
    }

    scaledGmvs = scaledGmvs.map((g, i) => {
      const capped = Math.max(-180, Math.min(1520, Math.round(g * 100) / 100));
      if (i >= dayCount - 5) {
        return Math.round(g * 100) / 100;
      }
      return capped;
    });
    const finalDrift =
      Math.round((targetGmv - scaledGmvs.reduce((s, v) => s + v, 0)) * 100) / 100;
    if (finalDrift !== 0 && bodyIndices.length > 0) {
      scaledGmvs[bodyIndices[0]] = Math.round(
        (scaledGmvs[bodyIndices[0]] + finalDrift) * 100
      ) / 100;
    }
  } else {
    scaledGmvs = rawGmvs;
  }

  const points: DailyMetricPoint[] = [];
  for (let i = 0; i < dayCount; i++) {
    const gmv = scaledGmvs[i];
    const units = Math.max(0, Math.round(gmv / (6 + rand() * 3)));
    const orders = Math.max(0, Math.round(units * (0.82 + rand() * 0.12)));

    points.push({
      date: dates[i],
      gmv,
      unitsSold: units,
      orders,
      aur: units > 0 ? Math.round((gmv / units) * 100) / 100 : 0,
    });
  }

  return points;
}
