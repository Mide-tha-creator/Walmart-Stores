import { MOCK_API_DELAY_MS } from "@/lib/constants";
import { isValidStoreId } from "@/config/stores/registry";
import type { StoreId } from "@/config/stores/types";
import {
  applyIncrementToWalmartSummary,
  computeRecentAnalyticsKpiIncrement,
} from "@/lib/store/recent-analytics-kpi-increment";
import { applyWalmartKpiDisplayMultiplier } from "@/lib/store/kpi-display-adjustment";
import {
  getResolvedWalmartBundle,
  loadStoreOverrides,
} from "@/lib/store/resolve-store-data";
import type { ReportFilters } from "@/types/common";
import type { WalmartSalesInsightsResponse, WalmartMetricKey } from "@/types/walmart";

function delay(ms: number = MOCK_API_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getWalmartInsights(
  storeId: string,
  filters: ReportFilters
): Promise<WalmartSalesInsightsResponse> {
  await delay();
  if (!isValidStoreId(storeId)) throw new Error(`Unknown store: ${storeId}`);

  const bundle = getResolvedWalmartBundle(storeId as StoreId);
  const filteredRows = bundle.tableRows
    .filter(
      (r) => r.date >= filters.range.start && r.date <= filters.range.end
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const points =
    filteredRows.length > 0 ? [...filteredRows].reverse() : bundle.tableRows;

  const computedSummary = {
    gmv: Math.round(points.reduce((s, r) => s + r.gmv, 0) * 100) / 100,
    unitsSold: points.reduce((s, r) => s + r.unitsSold, 0),
    orders: points.reduce((s, r) => s + r.orders, 0),
    aur: 0,
  };
  computedSummary.aur =
    computedSummary.unitsSold > 0
      ? Math.round((computedSummary.gmv / computedSummary.unitsSold) * 100) / 100
      : 0;

  const allOverrides = loadStoreOverrides(storeId);
  const overrides = allOverrides?.walmart;
  let summary = computedSummary;

  const kpiIncrement = computeRecentAnalyticsKpiIncrement(
    storeId as StoreId,
    allOverrides,
    filters.range
  );
  if (
    kpiIncrement.totalSales !== 0 ||
    kpiIncrement.unitsSold !== 0 ||
    kpiIncrement.orders !== 0
  ) {
    summary = applyIncrementToWalmartSummary(summary, kpiIncrement);
  }

  summary = applyWalmartKpiDisplayMultiplier(summary);

  if (overrides?.summary) {
    summary = { ...summary, ...overrides.summary };
  }

  const filteredTimeSeries: WalmartSalesInsightsResponse["timeSeries"] = {
    gmv: points.map((r) => ({ date: r.date, value: r.gmv })),
    unitsSold: points.map((r) => ({ date: r.date, value: r.unitsSold })),
    orders: points.map((r) => ({ date: r.date, value: r.orders })),
    aur: points.map((r) => ({ date: r.date, value: r.aur })),
  };

  return {
    summary,
    timeSeries:
      filteredRows.length > 0 ? filteredTimeSeries : bundle.timeSeries,
    tableRows: filteredRows.length > 0 ? filteredRows : bundle.tableRows,
  };
}

export function getMetricLabel(key: WalmartMetricKey): string {
  const labels: Record<WalmartMetricKey, string> = {
    gmv: "GMV",
    unitsSold: "Units Sold",
    orders: "Orders",
    aur: "AUR",
  };
  return labels[key];
}
