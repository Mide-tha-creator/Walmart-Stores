import { generateWalmartTimeSeries } from "@/mock-data/generators/time-series";
import { getTodayIso } from "@/lib/store/rolling-dashboard-range";
import type {
  AccountSalesSummary,
  DailySalesRow,
  WalmartMetricKey,
} from "@/types/walmart";
import type { WalmartStoreDataBundle, WalmartStoreDataConfig } from "@/types/store-data";

export const walmartSecondDataConfig: Omit<
  WalmartStoreDataConfig,
  "defaultSummary"
> & { targetSales?: number } = {
  timeSeriesSeed: 42,
  timeSeriesProfile: "volatile-bursts",
  rangeStart: "2024-05-01",
  rangeEnd: "2026-06-29",
  targetSales: 159681.25,
};

function buildTableRows(
  points: ReturnType<typeof generateWalmartTimeSeries>
): DailySalesRow[] {
  return points.map((p, i) => {
    const prev = points[i - 1];
    const gmvChangePercent =
      prev && prev.gmv > 0
        ? Math.round(((p.gmv - prev.gmv) / prev.gmv) * 10000) / 100
        : 0;
    const commission = Math.round(p.gmv * 0.15 * 100) / 100;
    return {
      date: p.date,
      gmv: p.gmv,
      gmvChangePercent,
      gmvNetCommission: Math.round((p.gmv - commission) * 100) / 100,
      unitsSold: p.unitsSold,
      orders: p.orders,
      aur: p.aur,
      authSales: Math.round(p.gmv * 0.92 * 100) / 100,
      cancelledSales: Math.round(p.gmv * 0.03 * 100) / 100,
      refundSales: Math.round(p.gmv * 0.02 * 100) / 100,
    };
  });
}

function summaryFromPoints(
  points: ReturnType<typeof generateWalmartTimeSeries>
): AccountSalesSummary {
  const gmv = Math.round(points.reduce((s, p) => s + p.gmv, 0) * 100) / 100;
  const unitsSold = points.reduce((s, p) => s + p.unitsSold, 0);
  const orders = points.reduce((s, p) => s + p.orders, 0);
  return {
    gmv,
    unitsSold,
    orders,
    aur: unitsSold > 0 ? Math.round((gmv / unitsSold) * 100) / 100 : 0,
  };
}

export function buildWalmartSecondBundle(): WalmartStoreDataBundle {
  const rangeStart = walmartSecondDataConfig.rangeStart;
  const rangeEnd = getTodayIso();

  const points = generateWalmartTimeSeries({
    startDate: rangeStart,
    endDate: rangeEnd,
    seed: walmartSecondDataConfig.timeSeriesSeed,
    walmartTimeSeriesProfile: walmartSecondDataConfig.timeSeriesProfile,
    targetSales: walmartSecondDataConfig.targetSales,
  });

  const tableRows = buildTableRows(points).reverse();
  const summary = summaryFromPoints(points);

  const timeSeries: Record<WalmartMetricKey, { date: string; value: number }[]> = {
    gmv: points.map((p) => ({ date: p.date, value: p.gmv })),
    unitsSold: points.map((p) => ({ date: p.date, value: p.unitsSold })),
    orders: points.map((p) => ({ date: p.date, value: p.orders })),
    aur: points.map((p) => ({ date: p.date, value: p.aur })),
  };

  return {
    config: {
      ...walmartSecondDataConfig,
      rangeStart,
      rangeEnd,
      defaultSummary: summary,
    },
    summary,
    timeSeries,
    tableRows,
  };
}
