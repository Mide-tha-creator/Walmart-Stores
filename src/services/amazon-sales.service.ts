import { MOCK_API_DELAY_MS } from "@/lib/constants";
import { getTodayIso } from "@/lib/store/rolling-dashboard-range";
import { ASIN_ALERTS } from "@/mock-data/amazon/asin-alerts";
import { DEFAULT_INSIGHTS } from "@/mock-data/amazon/insights-copy";
import { generateAmazonTimeSeries } from "@/mock-data/generators/time-series";
import type { ReportFilters } from "@/types/common";
import type {
  CompareSalesAggregate,
  SalesDashboardResponse,
  SalesSnapshot,
  SalesTimeSeriesPoint,
} from "@/types/amazon";

const FULL_SERIES_START = "2023-05-16";

const fulfillmentMultipliers: Record<ReportFilters["fulfillment"], number> = {
  both: 1,
  amazon: 0.72,
  seller: 0.35,
};

function delay(ms: number = MOCK_API_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function filterSeries(
  series: SalesTimeSeriesPoint[],
  range: ReportFilters["range"]
): SalesTimeSeriesPoint[] {
  return series.filter((p) => p.date >= range.start && p.date <= range.end);
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

function buildSnapshot(aggregate: CompareSalesAggregate): SalesSnapshot {
  return {
    totalOrderItems: aggregate.totalOrderItems,
    unitsOrdered: aggregate.unitsOrdered,
    orderedProductSales: aggregate.orderedProductSales,
    avgUnitsPerOrderItem: aggregate.avgUnitsPerOrderItem,
    avgSalesPerOrderItem: aggregate.avgSalesPerOrderItem,
    generatedAt: new Date().toISOString(),
  };
}

export async function getSalesDashboard(
  filters: ReportFilters
): Promise<SalesDashboardResponse> {
  await delay();

  const mult = fulfillmentMultipliers[filters.fulfillment];
  const fullSeries = generateAmazonTimeSeries({
    startDate: FULL_SERIES_START,
    endDate: getTodayIso(),
    seed: 42,
    fulfillmentMultiplier: mult,
  });

  const timeSeries = filterSeries(fullSeries, filters.range);
  const aggregate = aggregateFromSeries(timeSeries);
  const snapshot = buildSnapshot(aggregate);

  return {
    snapshot,
    timeSeries,
    aggregate,
    insights: DEFAULT_INSIGHTS,
    asinAlerts: ASIN_ALERTS,
  };
}
