import { getWalmartBundle } from "@/data/stores/registry";
import { normalizeTableRowDate } from "@/lib/store/walmart-table-rows";
import type { StoreId } from "@/config/stores/types";
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
  overrides: StoreOverrides
): RecentAnalyticsRecord[] {
  if (overrides.recentAnalytics?.records?.length) {
    return overrides.recentAnalytics.records;
  }

  if (overrides.walmart?.tableRows?.length) {
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

  const records = recordsFromOverrides(overrides);
  if (records.length === 0) return { ...EMPTY_INCREMENT };

  const increment: KpiIncrement = { ...EMPTY_INCREMENT };
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
