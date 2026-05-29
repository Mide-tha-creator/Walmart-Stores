import { getAmazonBundle, getWalmartBundle } from "@/data/stores/registry";
import { getStoreConfig } from "@/config/stores/registry";
import type { StoreId } from "@/config/stores/types";
import { normalizeTableRowDate } from "@/lib/store/walmart-table-rows";
import type { CompareSalesAggregate } from "@/types/amazon";
import type { DateRange } from "@/types/common";
import type { RecentAnalyticsRecord } from "@/types/recent-analytics";
import type { StoreOverrides } from "@/types/store-data";
import type { AccountSalesSummary } from "@/types/walmart";

export interface KpiIncrement {
  totalSales: number;
  unitsSold: number;
  orders: number;
}

const EMPTY_INCREMENT: KpiIncrement = {
  totalSales: 0,
  unitsSold: 0,
  orders: 0,
};

function isInRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

function getAmazonBaselineByDate(storeId: StoreId): Map<string, { sales: number; units: number }> {
  const series = getAmazonBundle(storeId).fullTimeSeries;
  const map = new Map<string, { sales: number; units: number }>();
  for (const p of series) {
    map.set(p.date, {
      sales: p.orderedProductSales,
      units: p.unitsOrdered,
    });
  }
  return map;
}

function getWalmartBaselineByDate(
  storeId: StoreId
): Map<string, { sales: number; units: number; orders: number }> {
  const rows = getWalmartBundle(storeId).tableRows;
  const map = new Map<string, { sales: number; units: number; orders: number }>();
  for (const r of rows) {
    const date = normalizeTableRowDate(r.date);
    map.set(date, { sales: r.gmv, units: r.unitsSold, orders: r.orders });
  }
  return map;
}

function accumulateDelta(
  increment: KpiIncrement,
  edited: { totalSales: number; unitsSold: number; orders?: number },
  baseline: { sales: number; units: number; orders: number }
): void {
  increment.totalSales += edited.totalSales - baseline.sales;
  increment.unitsSold += edited.unitsSold - baseline.units;
  const editedOrders =
    edited.orders ?? Math.max(1, Math.round(edited.unitsSold / 1.2));
  increment.orders += editedOrders - baseline.orders;
}

function recordsFromOverrides(
  storeId: StoreId,
  overrides: StoreOverrides
): RecentAnalyticsRecord[] {
  if (overrides.recentAnalytics?.records?.length) {
    return overrides.recentAnalytics.records;
  }

  const config = getStoreConfig(storeId);
  if (config.marketplace === "amazon" && overrides.amazon?.timeSeries?.length) {
    return overrides.amazon.timeSeries.map((p) => ({
      date: p.date,
      totalSales: p.orderedProductSales,
      unitsSold: p.unitsOrdered,
    }));
  }

  if (config.marketplace === "walmart" && overrides.walmart?.tableRows?.length) {
    return overrides.walmart.tableRows.map((r) => ({
      date: normalizeTableRowDate(r.date),
      totalSales: r.gmv,
      unitsSold: r.unitsSold,
      orders: r.orders,
    }));
  }

  return [];
}

export function computeRecentAnalyticsKpiIncrement(
  storeId: StoreId,
  overrides: StoreOverrides | null,
  range: DateRange
): KpiIncrement {
  if (!overrides) return { ...EMPTY_INCREMENT };

  const records = recordsFromOverrides(storeId, overrides);
  if (records.length === 0) return { ...EMPTY_INCREMENT };

  const config = getStoreConfig(storeId);
  const increment: KpiIncrement = { ...EMPTY_INCREMENT };

  if (config.marketplace === "amazon") {
    const baselineByDate = getAmazonBaselineByDate(storeId);
    for (const record of records) {
      const date = normalizeTableRowDate(record.date);
      if (!isInRange(date, range)) continue;
      const baseline = baselineByDate.get(date) ?? { sales: 0, units: 0, orders: 0 };
      accumulateDelta(
        increment,
        record,
        { sales: baseline.sales, units: baseline.units, orders: 0 }
      );
    }
    return {
      totalSales: Math.round(increment.totalSales * 100) / 100,
      unitsSold: increment.unitsSold,
      orders: increment.orders,
    };
  }

  const baselineByDate = getWalmartBaselineByDate(storeId);
  for (const record of records) {
    const date = normalizeTableRowDate(record.date);
    if (!isInRange(date, range)) continue;
    const baseline = baselineByDate.get(date) ?? { sales: 0, units: 0, orders: 0 };
    accumulateDelta(increment, record, baseline);
  }

  return {
    totalSales: Math.round(increment.totalSales * 100) / 100,
    unitsSold: increment.unitsSold,
    orders: increment.orders,
  };
}

export function applyIncrementToAmazonAggregate(
  baseline: CompareSalesAggregate,
  increment: KpiIncrement
): CompareSalesAggregate {
  const unitsOrdered = baseline.unitsOrdered + increment.unitsSold;
  const orderedProductSales =
    Math.round((baseline.orderedProductSales + increment.totalSales) * 100) / 100;
  const totalOrderItems =
    baseline.totalOrderItems + Math.round(increment.unitsSold / 1.24);
  const avgUnitsPerOrderItem =
    totalOrderItems > 0
      ? Math.round((unitsOrdered / totalOrderItems) * 100) / 100
      : 0;
  const avgSalesPerOrderItem =
    totalOrderItems > 0
      ? Math.round((orderedProductSales / totalOrderItems) * 100) / 100
      : 0;

  return {
    ...baseline,
    totalOrderItems,
    unitsOrdered,
    orderedProductSales,
    avgUnitsPerOrderItem,
    avgSalesPerOrderItem,
  };
}

export function applyIncrementToWalmartSummary(
  baseline: AccountSalesSummary,
  increment: KpiIncrement
): AccountSalesSummary {
  const gmv = Math.round((baseline.gmv + increment.totalSales) * 100) / 100;
  const unitsSold = baseline.unitsSold + increment.unitsSold;
  const orders = baseline.orders + increment.orders;
  const aur =
    unitsSold > 0 ? Math.round((gmv / unitsSold) * 100) / 100 : 0;

  return { gmv, unitsSold, orders, aur };
}
