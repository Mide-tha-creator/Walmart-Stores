import { mulberry32 } from "@/mock-data/generators/random";

const TAIL_DAYS = 5;
const SEED_OFFSET = 99105;

/** Growth multipliers relative to baseline for each tail day (day 0 = first of last 5). */
const WALMART_GROWTH_CURVE = [1.06, 1.09, 1.22, 1.14, 1.11];

export type TrailingGrowthProfile =
  | "walmart-main"
  | "walmart-second"
  | "default";

export interface TrailingFiveDayGrowthOptions {
  seed: number;
  profile?: TrailingGrowthProfile;
}

function percentile(values: number[], p: number): number {
  const positive = values.filter((v) => v > 0);
  if (positive.length === 0) return 0;
  const sorted = [...positive].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[idx];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function resolveBaseline(
  values: number[],
  tailStart: number,
  profile: TrailingGrowthProfile
): number {
  const preTail7 = values.slice(Math.max(0, tailStart - 7), tailStart);
  const preTail30 = values.slice(Math.max(0, tailStart - 30), tailStart);
  const sevenDayAvg = avg(preTail7);
  const p25 = percentile(preTail30, 25);

  if (profile === "walmart-main") {
    return Math.max(sevenDayAvg, Math.max(p25, 120));
  }

  return sevenDayAvg > 0 ? sevenDayAvg : p25;
}

function profileNoiseScale(profile: TrailingGrowthProfile): number {
  switch (profile) {
    case "walmart-main":
      return 0.12;
    case "walmart-second":
      return 0.08;
    default:
      return 0.06;
  }
}

function profileBlend(profile: TrailingGrowthProfile): number {
  return profile === "walmart-main" ? 0.72 : 0.65;
}

function growthMultiplier(
  dayOffset: number,
  rand: () => number,
  profile: TrailingGrowthProfile
): number {
  const base = WALMART_GROWTH_CURVE[dayOffset] ?? WALMART_GROWTH_CURVE[WALMART_GROWTH_CURVE.length - 1];
  const noise = profileNoiseScale(profile);
  const spikeBoost = profile === "walmart-main" && dayOffset === 2 ? 0.05 : 0;
  return base * (1 + (rand() - 0.5) * noise + spikeBoost);
}

export interface WalmartTailPoint {
  date: string;
  gmv: number;
  unitsSold: number;
  orders: number;
  aur: number;
}

function applyDerivedWalmartMetrics(
  point: WalmartTailPoint,
  gmv: number,
  rand: () => number
): WalmartTailPoint {
  const units = Math.max(0, Math.round(gmv / (8 + rand() * 4)));
  const orders = Math.max(0, Math.round(units * (0.85 + rand() * 0.1)));
  return {
    date: point.date,
    gmv: Math.round(gmv * 100) / 100,
    unitsSold: units,
    orders,
    aur: units > 0 ? Math.round((gmv / units) * 100) / 100 : 0,
  };
}

export function applyTrailingFiveDayGrowthWalmart(
  points: WalmartTailPoint[],
  options: TrailingFiveDayGrowthOptions
): WalmartTailPoint[] {
  if (points.length < TAIL_DAYS + 1) return points;

  const profile = options.profile ?? "default";
  const rand = mulberry32(options.seed + SEED_OFFSET + 17);
  const result = points.map((p) => ({ ...p }));
  const tailStart = result.length - TAIL_DAYS;

  const gmvValues = result.map((p) => p.gmv);
  const baselineGmv = resolveBaseline(gmvValues, tailStart, profile);

  const blend = profileBlend(profile);

  for (let d = 0; d < TAIL_DAYS; d++) {
    const idx = tailStart + d;
    const mult = growthMultiplier(d, rand, profile);
    let shapedGmv = baselineGmv * mult;

    if (profile === "walmart-main") {
      shapedGmv = Math.min(220, Math.max(100, shapedGmv));
    }

    const existing = result[idx];
    const newGmv =
      existing.gmv * (1 - blend) + shapedGmv * blend;

    result[idx] = applyDerivedWalmartMetrics(
      existing,
      Math.max(0, newGmv),
      rand
    );
  }

  return result;
}

export function walmartProfileToGrowthProfile(
  profile?: string
): TrailingGrowthProfile {
  switch (profile) {
    case "spike-collapse":
      return "walmart-main";
    case "volatile-bursts":
      return "walmart-second";
    default:
      return "default";
  }
}
