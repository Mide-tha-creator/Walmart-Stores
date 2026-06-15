import { mulberry32 } from "@/mock-data/generators/random";
import type { DailyMetricPoint } from "@/mock-data/generators/time-series";

const LAST_90_DAYS = 90;
/** ~5 months of ramp before the active 90-day window */
const TRANSITION_DAYS = 152;
const SEED_OFFSET = 88099;

function applyDerivedMetrics(
  point: DailyMetricPoint,
  gmv: number,
  rand: () => number
): DailyMetricPoint {
  const units = Math.max(0, Math.round(gmv / (8 + rand() * 4)));
  const orders = Math.max(0, Math.round(units * (0.85 + rand() * 0.1)));
  return {
    date: point.date,
    gmv,
    unitsSold: units,
    orders,
    aur: units > 0 ? Math.round((gmv / units) * 100) / 100 : 0,
  };
}

function buildClusterFlags(
  length: number,
  rand: () => number,
  clusterCount: number,
  options?: { forceOverlapEnd?: number }
): boolean[] {
  const burstFlag = new Array<boolean>(length).fill(false);
  for (let c = 0; c < clusterCount; c++) {
    const runLength = 2 + Math.floor(rand() * 3);
    const maxStart = Math.max(0, length - runLength);
    let lowerBound = 0;
    if (c === 0 && options?.forceOverlapEnd != null) {
      const end = options.forceOverlapEnd;
      lowerBound = Math.max(0, end - runLength + 1);
    }
    const range = Math.max(0, maxStart - lowerBound);
    const startOffset = lowerBound + Math.floor(rand() * (range + 1));
    for (let k = 0; k < runLength; k++) {
      const idx = startOffset + k;
      if (idx >= 0 && idx < length) burstFlag[idx] = true;
    }
  }
  return burstFlag;
}

export interface ApplyWalmartLast90DaysLiftOptions {
  seed: number;
  /** Defaults to false — lifted GMV is additive; summary KPIs use defaultSummary. */
  preserveTotals?: boolean;
}

/**
 * Lift the last ~5 months + 90 days of Walmart GMV: a transition band with
 * moderate highs/lows, then a stronger active 90-day tail. Earlier history
 * is untouched.
 */
export function applyWalmartLast90DaysLift(
  points: DailyMetricPoint[],
  options: ApplyWalmartLast90DaysLiftOptions
): DailyMetricPoint[] {
  const dayCount = points.length;
  if (dayCount === 0 || dayCount < LAST_90_DAYS) return points;

  const activeStart = dayCount - LAST_90_DAYS;
  const transitionStart = Math.max(0, activeStart - TRANSITION_DAYS);
  if (transitionStart >= dayCount) return points;

  const baselineEnd = transitionStart;
  const baselineGmv = points.slice(0, baselineEnd).map((p) => p.gmv);
  const positiveBaseline = baselineGmv.filter((v) => v > 0);
  const histMax = positiveBaseline.length > 0 ? Math.max(...positiveBaseline) : 1;

  const rand = mulberry32(options.seed + SEED_OFFSET);
  const result = points.map((p) => ({ ...p }));

  // --- Transition window (5 months before the active 90 days) ---
  const transitionLength = activeStart - transitionStart;
  if (transitionLength > 0) {
    const transitionBurst = buildClusterFlags(
      transitionLength,
      rand,
      2 + Math.floor(rand() * 2)
    );
    const transitionDip = new Array<boolean>(transitionLength).fill(false);
    for (let t = 0; t < transitionLength; t++) {
      if (!transitionBurst[t] && rand() < 0.18) transitionDip[t] = true;
    }

    const transitionHero = new Array<boolean>(transitionLength).fill(false);
    const heroZoneStart = Math.floor(transitionLength * 0.65);
    const heroSlots = 1 + Math.floor(rand() * 2);
    for (let h = 0; h < heroSlots; h++) {
      const idx =
        heroZoneStart +
        Math.floor(rand() * Math.max(1, transitionLength - heroZoneStart));
      transitionHero[idx] = true;
      transitionBurst[idx] = true;
    }

    for (let i = transitionStart; i < activeStart; i++) {
      const offset = i - transitionStart;
      const progress =
        transitionLength > 1 ? offset / (transitionLength - 1) : 1;
      const weekly = 1 + 0.06 * Math.sin((i / 7) * Math.PI * 2);
      const oldGmv = result[i].gmv;

      let target: number;
      if (transitionHero[offset]) {
        target = histMax * (0.3 + rand() * 0.08) * weekly;
      } else if (transitionBurst[offset]) {
        const burstBase = 0.2 + progress * 0.14;
        target = histMax * (burstBase + rand() * 0.1) * weekly;
      } else if (transitionDip[offset]) {
        target = histMax * (0.1 + rand() * 0.06) * weekly;
      } else {
        const bandBase = 0.12 + progress * 0.1;
        target = histMax * (bandBase + rand() * 0.08) * weekly;
      }

      const targetWeight = 0.4 + progress * 0.45;
      const blendedGmv = oldGmv * (1 - targetWeight) + target * targetWeight;
      const newGmv = Math.max(0, Math.round(blendedGmv * 100) / 100);
      result[i] = applyDerivedMetrics(result[i], newGmv, rand);
    }
  }

  // --- Active last 90 days (stronger peaks than transition) ---
  const activeLength = dayCount - activeStart;
  const last30Start = Math.max(0, activeLength - 30);
  const activeBurst = buildClusterFlags(
    activeLength,
    rand,
    2 + Math.floor(rand() * 3),
    { forceOverlapEnd: activeLength - 1 }
  );
  const activeHero = new Array<boolean>(activeLength).fill(false);
  const heroCount = 2 + Math.floor(rand() * 2);
  for (let h = 0; h < heroCount; h++) {
    const idx =
      last30Start + Math.floor(rand() * Math.max(1, activeLength - last30Start));
    activeHero[idx] = true;
    activeBurst[idx] = true;
  }
  const activeDip = new Array<boolean>(activeLength).fill(false);
  for (let t = 0; t < activeLength; t++) {
    if (!activeBurst[t] && rand() < 0.12) activeDip[t] = true;
  }

  for (let i = activeStart; i < dayCount; i++) {
    const offset = i - activeStart;
    const weekly = 1 + 0.06 * Math.sin((i / 7) * Math.PI * 2);
    const oldGmv = result[i].gmv;

    let target: number;
    if (activeHero[offset]) {
      target = histMax * (0.62 + rand() * 0.22) * weekly;
    } else if (activeBurst[offset]) {
      target = histMax * (0.45 + rand() * 0.28) * weekly;
    } else if (activeDip[offset]) {
      target = histMax * (0.2 + rand() * 0.1) * weekly;
    } else {
      target = histMax * (0.3 + rand() * 0.14) * weekly;
    }

    const blendedGmv = oldGmv * 0.08 + target * 0.92;
    const newGmv = Math.max(0, Math.round(blendedGmv * 100) / 100);
    result[i] = applyDerivedMetrics(result[i], newGmv, rand);
  }

  void options.preserveTotals;

  return result;
}
