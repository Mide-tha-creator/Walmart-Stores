import { mulberry32 } from "@/mock-data/generators/random";
import {
  applyTrailingFiveDayGrowthWalmart,
  walmartProfileToGrowthProfile,
} from "@/mock-data/generators/apply-trailing-five-day-growth";
import { applyWalmartLast90DaysLift } from "@/mock-data/generators/walmart-last-90-days-lift";
import { generateWalmartSecondSeries } from "@/mock-data/generators/walmart-second-series";
import type { WalmartTimeSeriesProfile } from "@/types/store-data";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface GenerateTimeSeriesOptions {
  startDate: string;
  endDate: string;
  seed?: number;
  targetUnits?: number;
  targetSales?: number;
  walmartTimeSeriesProfile?: WalmartTimeSeriesProfile;
}

function applyDerivedWalmartPoint(
  point: DailyMetricPoint,
  gmv: number,
  rand: () => number
): DailyMetricPoint {
  const units = Math.max(0, Math.round(gmv / (8 + rand() * 4)));
  const orders = Math.max(0, Math.round(units * (0.85 + rand() * 0.1)));
  const roundedGmv = Math.round(gmv * 100) / 100;
  return {
    date: point.date,
    gmv: roundedGmv,
    unitsSold: units,
    orders,
    aur: units > 0 ? Math.round((roundedGmv / units) * 100) / 100 : 0,
  };
}

/** Scale the full series proportionally so total GMV matches targetSales. */
function reconcileWalmartTargetGmv(
  points: DailyMetricPoint[],
  targetGmv: number | undefined,
  seed: number
): DailyMetricPoint[] {
  if (!targetGmv || targetGmv <= 0 || points.length === 0) return points;

  const current = points.reduce((s, p) => s + p.gmv, 0);
  if (current <= 0) return points;

  const rand = mulberry32(seed + 31);
  const scale = targetGmv / current;
  const scaled = points.map((p) =>
    applyDerivedWalmartPoint(p, p.gmv * scale, rand)
  );

  const drift =
    Math.round((targetGmv - scaled.reduce((s, p) => s + p.gmv, 0)) * 100) / 100;
  if (drift !== 0 && scaled.length > 0) {
    const last = scaled.length - 1;
    scaled[last] = applyDerivedWalmartPoint(
      scaled[last],
      scaled[last].gmv + drift,
      rand
    );
  }

  return scaled;
}

function finishWalmartSeries(
  points: DailyMetricPoint[],
  options: GenerateTimeSeriesOptions
): DailyMetricPoint[] {
  const seed = options.seed ?? 42;
  const grown = applyTrailingFiveDayGrowthWalmart(points, {
    seed,
    profile: walmartProfileToGrowthProfile(options.walmartTimeSeriesProfile),
  });

  return reconcileWalmartTargetGmv(grown, options.targetSales, seed);
}

export function generateWalmartTimeSeries(
  options: GenerateTimeSeriesOptions
): DailyMetricPoint[] {
  if (options.walmartTimeSeriesProfile === "volatile-bursts") {
    return finishWalmartSeries(
      generateWalmartSecondSeries({
        startDate: options.startDate,
        endDate: options.endDate,
        seed: options.seed,
        targetGmv: options.targetSales,
      }),
      options
    );
  }

  const rand = mulberry32((options.seed ?? 42) + 7);
  const start = new Date(options.startDate);
  const end = new Date(options.endDate);
  const points: DailyMetricPoint[] = [];
  const cursor = new Date(start);
  let dayIndex = 0;

  const dayCount = Math.max(
    1,
    Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
  const targetGmv = options.targetSales && options.targetSales > 0 ? options.targetSales : null;
  const rawGmvs: number[] = [];

  while (cursor <= end) {
    const progress = dayCount > 1 ? dayIndex / (dayCount - 1) : 0;
    let base = 250 + rand() * 350 + Math.sin((dayIndex / 30) * Math.PI) * 200;

    if (options.walmartTimeSeriesProfile === "spike-collapse") {
      if (progress < 0.16) {
        base = 500 + rand() * 350 + Math.sin(dayIndex / 8) * 80;
      } else if (progress < 0.36) {
        base = 520 + rand() * 500 + Math.sin(dayIndex / 6) * 120;
      } else if (progress < 0.58) {
        base = 650 + rand() * 650 + Math.sin(dayIndex / 5) * 180;
        if (rand() > 0.93) base += 1000 + rand() * 900;
        if (rand() > 0.985) base += 2200 + rand() * 700;
      } else if (progress < 0.72) {
        base = 380 + rand() * 520 + Math.sin(dayIndex / 5) * 140;
        if (rand() > 0.95) base += 900 + rand() * 800;
      } else if (progress < 0.86) {
        base = rand() * 35;
        if (rand() > 0.93) base += 120 + rand() * 260;
      } else {
        base = rand() * 55;
        if (rand() > 0.9) base += 140 + rand() * 280;
      }
    }

    const gmv = Math.max(0, Math.round(base * 100) / 100);
    rawGmvs.push(gmv);
    cursor.setDate(cursor.getDate() + 1);
    dayIndex++;
  }

  const rawSum = rawGmvs.reduce((s, v) => s + v, 0);
  const scale = targetGmv && rawSum > 0 ? targetGmv / rawSum : 1;

  const scaledGmvs = rawGmvs.map((g) => Math.max(0, Math.round(g * scale * 100) / 100));
  if (targetGmv && scaledGmvs.length > 0) {
    const drift = Math.round((targetGmv - scaledGmvs.reduce((s, v) => s + v, 0)) * 100) / 100;
    scaledGmvs[scaledGmvs.length - 1] = Math.max(
      0,
      Math.round((scaledGmvs[scaledGmvs.length - 1] + drift) * 100) / 100
    );
  }

  const outCursor = new Date(start);
  dayIndex = 0;
  while (outCursor <= end) {
    const gmv = scaledGmvs[dayIndex] ?? 0;
    const units = Math.round(gmv / (8 + rand() * 4));
    const orders = Math.round(units * (0.85 + rand() * 0.1));

    points.push({
      date: toIsoDate(outCursor),
      gmv,
      unitsSold: units,
      orders,
      aur: units > 0 ? Math.round((gmv / units) * 100) / 100 : 0,
    });

    outCursor.setDate(outCursor.getDate() + 1);
    dayIndex++;
  }

  if (options.walmartTimeSeriesProfile === "spike-collapse") {
    return finishWalmartSeries(
      applyWalmartLast90DaysLift(points, {
        seed: options.seed ?? 42,
        preserveTotals: false,
      }),
      options
    );
  }

  return finishWalmartSeries(points, options);
}

export interface DailyMetricPoint {
  date: string;
  gmv: number;
  unitsSold: number;
  orders: number;
  aur: number;
}
