import { MOCK_API_DELAY_MS } from "@/lib/constants";
import { getStoreConfig, isValidStoreId } from "@/config/stores/registry";
import type { StoreId } from "@/config/stores/types";
import {
  applyIncrementToAmazonAggregate,
  applyIncrementToWalmartSummary,
  computeRecentAnalyticsKpiIncrement,
} from "@/lib/store/recent-analytics-kpi-increment";
import {
  getResolvedAmazonBundle,
  getResolvedWalmartBundle,
  loadStoreOverrides,
} from "@/lib/store/resolve-store-data";
import type { ReportFilters } from "@/types/common";
import type {
  CompareSalesAggregate,
  SalesDashboardResponse,
  SalesSnapshot,
  SalesTimeSeriesPoint,
} from "@/types/amazon";
import type { WalmartSalesInsightsResponse, WalmartMetricKey } from "@/types/walmart";

const fulfillmentMultipliers: Record<ReportFilters["fulfillment"], number> = {
  both: 1,
  amazon: 0.72,
  seller: 0.35,
};

const salesBreakdownMultipliers: Record<
  ReportFilters["salesBreakdown"],
  number
> = {
  marketplace_total: 1,
  fba_only: 0.68,
  seller_only: 0.38,
};

function applySalesBreakdownToSeries(
  series: SalesTimeSeriesPoint[],
  salesBreakdown: ReportFilters["salesBreakdown"]
): SalesTimeSeriesPoint[] {
  const mult = salesBreakdownMultipliers[salesBreakdown];
  if (mult === 1) return series;
  return series.map((p) => ({
    ...p,
    unitsOrdered: Math.round(p.unitsOrdered * mult),
    orderedProductSales: Math.round(p.orderedProductSales * mult * 100) / 100,
  }));
}

function scaleAggregate(
  aggregate: CompareSalesAggregate,
  multiplier: number
): CompareSalesAggregate {
  if (multiplier === 1) return aggregate;
  return {
    ...aggregate,
    label: aggregate.label,
    totalOrderItems: Math.round(aggregate.totalOrderItems * multiplier),
    unitsOrdered: Math.round(aggregate.unitsOrdered * multiplier),
    orderedProductSales:
      Math.round(aggregate.orderedProductSales * multiplier * 100) / 100,
    avgUnitsPerOrderItem: aggregate.avgUnitsPerOrderItem,
    avgSalesPerOrderItem:
      Math.round(aggregate.avgSalesPerOrderItem * multiplier * 100) / 100,
  };
}

function delay(ms: number = MOCK_API_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function filterSeries(
  series: SalesTimeSeriesPoint[],
  range: ReportFilters["range"]
): SalesTimeSeriesPoint[] {
  return series.filter((p) => p.date >= range.start && p.date <= range.end);
}

function applyFulfillmentToSeries(
  series: SalesTimeSeriesPoint[],
  fulfillment: ReportFilters["fulfillment"]
): SalesTimeSeriesPoint[] {
  const mult = fulfillmentMultipliers[fulfillment];
  if (mult === 1) return series;
  return series.map((p) => ({
    ...p,
    unitsOrdered: Math.round(p.unitsOrdered * mult),
    orderedProductSales: Math.round(p.orderedProductSales * mult * 100) / 100,
  }));
}

function aggregateFromSeries(series: SalesTimeSeriesPoint[]): CompareSalesAggregate {
  const totalOrderItems = series.reduce(
    (sum, p) => sum + Math.round(p.unitsOrdered / 1.24),
    0
  );
  const unitsOrdered = series.reduce((sum, p) => sum + p.unitsOrdered, 0);
  const orderedProductSales = series.reduce(
    (sum, p) => sum + p.orderedProductSales,
    0
  );
  const avgUnitsPerOrderItem =
    totalOrderItems > 0
      ? Math.round((unitsOrdered / totalOrderItems) * 100) / 100
      : 0;
  const avgSalesPerOrderItem =
    totalOrderItems > 0
      ? Math.round((orderedProductSales / totalOrderItems) * 100) / 100
      : 0;

  return {
    label: "Selected date range",
    totalOrderItems,
    unitsOrdered,
    orderedProductSales: Math.round(orderedProductSales * 100) / 100,
    avgUnitsPerOrderItem,
    avgSalesPerOrderItem,
  };
}

function buildSnapshot(
  aggregate: CompareSalesAggregate,
  override?: Partial<SalesSnapshot>
): SalesSnapshot {
  const base: SalesSnapshot = {
    totalOrderItems: aggregate.totalOrderItems,
    unitsOrdered: aggregate.unitsOrdered,
    orderedProductSales: aggregate.orderedProductSales,
    avgUnitsPerOrderItem: aggregate.avgUnitsPerOrderItem,
    avgSalesPerOrderItem: aggregate.avgSalesPerOrderItem,
    generatedAt: new Date().toISOString(),
  };
  if (!override) return base;
  return {
    ...base,
    ...override,
    generatedAt: override.generatedAt ?? base.generatedAt,
  };
}

export async function getAmazonDashboard(
  storeId: string,
  filters: ReportFilters
): Promise<SalesDashboardResponse> {
  await delay();
  if (!isValidStoreId(storeId)) throw new Error(`Unknown store: ${storeId}`);

  const bundle = getResolvedAmazonBundle(storeId as StoreId);
  const allOverrides = loadStoreOverrides(storeId);
  const overrides = allOverrides?.amazon;

  let fullSeries = bundle.fullTimeSeries;
  fullSeries = applyFulfillmentToSeries(fullSeries, filters.fulfillment);
  fullSeries = applySalesBreakdownToSeries(fullSeries, filters.salesBreakdown);
  const timeSeries = filterSeries(fullSeries, filters.range);

  const computedAggregate = aggregateFromSeries(timeSeries);
  const defaultAggregate = bundle.config.defaultAggregate;
  const filterScale =
    fulfillmentMultipliers[filters.fulfillment] *
    salesBreakdownMultipliers[filters.salesBreakdown];

  let baseAggregate = defaultAggregate
    ? scaleAggregate(defaultAggregate, filterScale)
    : computedAggregate;

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
    baseAggregate = applyIncrementToAmazonAggregate(baseAggregate, kpiIncrement);
  }

  const aggregate = overrides?.aggregate
    ? { ...baseAggregate, ...overrides.aggregate }
    : baseAggregate;

  const snapshot = buildSnapshot(aggregate, {
    ...overrides?.snapshot,
    generatedAt:
      overrides?.snapshot?.generatedAt ??
      (defaultAggregate ? "2026-05-15T16:20:56-07:00" : undefined),
  });

  return {
    snapshot,
    timeSeries,
    aggregate,
    insights: bundle.config.insights,
    asinAlerts: bundle.config.asinAlerts,
  };
}

export async function getWalmartInsights(
  storeId: string,
  filters: ReportFilters
): Promise<WalmartSalesInsightsResponse> {
  await delay();
  if (!isValidStoreId(storeId)) throw new Error(`Unknown store: ${storeId}`);

  const bundle = getResolvedWalmartBundle(storeId as StoreId);
  const filteredRows = bundle.tableRows.filter(
    (r) => r.date >= filters.range.start && r.date <= filters.range.end
  );

  const points = filteredRows.length > 0 ? [...filteredRows].reverse() : bundle.tableRows;

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

  const storeConfig = getStoreConfig(storeId);
  const isDefaultRange =
    filters.range.start === storeConfig.defaultDateRange.start &&
    filters.range.end === storeConfig.defaultDateRange.end;

  const allOverrides = loadStoreOverrides(storeId);
  const overrides = allOverrides?.walmart;
  let summary =
    isDefaultRange && bundle.config.defaultSummary
      ? bundle.config.defaultSummary
      : computedSummary;

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
