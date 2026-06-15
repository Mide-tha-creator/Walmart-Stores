import { getWalmartBundle } from "@/data/stores/registry";
import type { StoreId } from "@/config/stores/types";
import {
  filterRecordsToWindow,
  getRecentAnalyticsWindow,
  getStoreAnalyticsAnchorEnd,
  isLockedHistoricalDate,
} from "@/lib/store/recent-analytics-window";
import { normalizeTableRowDate, recalculateWalmartTableRows } from "@/lib/store/walmart-table-rows";
import type { DailySalesRow } from "@/types/walmart";
import type { StoreOverrides, WalmartStoreDataBundle } from "@/types/store-data";
import type { RecentAnalyticsRecord } from "@/types/recent-analytics";

function recordToWalmartRow(
  record: RecentAnalyticsRecord,
  template?: DailySalesRow
): DailySalesRow {
  const date = normalizeTableRowDate(record.date);
  const gmv = record.totalSales;
  const unitsSold = record.unitsSold;
  const orders = record.orders ?? template?.orders ?? Math.max(1, Math.round(unitsSold / 1.2));
  return {
    date,
    gmv,
    gmvChangePercent: template?.gmvChangePercent ?? 0,
    gmvNetCommission: template?.gmvNetCommission ?? 0,
    unitsSold,
    orders,
    aur: unitsSold > 0 ? Math.round((gmv / unitsSold) * 100) / 100 : 0,
    authSales: template?.authSales ?? Math.round(gmv * 0.92 * 100) / 100,
    cancelledSales: template?.cancelledSales ?? Math.round(gmv * 0.03 * 100) / 100,
    refundSales: template?.refundSales ?? Math.round(gmv * 0.02 * 100) / 100,
  };
}

export function walmartRowsToRecords(
  rows: DailySalesRow[],
  windowStart: string
): RecentAnalyticsRecord[] {
  return rows
    .filter((r) => {
      const d = normalizeTableRowDate(r.date);
      return d >= windowStart;
    })
    .map((r) => ({
      date: normalizeTableRowDate(r.date),
      totalSales: r.gmv,
      unitsSold: r.unitsSold,
      orders: r.orders,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function mergeWalmartRowsByDate(
  locked: DailySalesRow[],
  windowRows: DailySalesRow[]
): DailySalesRow[] {
  const byDate = new Map<string, DailySalesRow>();
  for (const row of locked) {
    byDate.set(normalizeTableRowDate(row.date), row);
  }
  for (const row of windowRows) {
    byDate.set(normalizeTableRowDate(row.date), row);
  }
  return recalculateWalmartTableRows(
    [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  );
}

export function mergeRecentAnalyticsIntoWalmartBundle(
  base: WalmartStoreDataBundle,
  overrides: StoreOverrides | null
): DailySalesRow[] {
  const anchorEnd = getStoreAnalyticsAnchorEnd(base.config);
  const window = getRecentAnalyticsWindow(anchorEnd);

  let rows = [...base.tableRows];

  if (overrides?.walmart?.tableRows && !overrides.recentAnalytics?.records?.length) {
    return overrides.walmart.tableRows;
  }

  if (overrides?.walmart?.tableRows) {
    rows = overrides.walmart.tableRows;
  }

  const records = overrides?.recentAnalytics?.records ?? [];
  const filtered = filterRecordsToWindow(records, window);
  if (filtered.length === 0) return rows;

  const rowByDate = new Map(
    rows.map((r) => [normalizeTableRowDate(r.date), r])
  );
  const locked = rows.filter((r) =>
    isLockedHistoricalDate(normalizeTableRowDate(r.date), window)
  );
  const windowRows = filtered.map((r) =>
    recordToWalmartRow(r, rowByDate.get(normalizeTableRowDate(r.date)))
  );

  return mergeWalmartRowsByDate(locked, windowRows);
}

export function loadRecentAnalyticsRecordsForStore(
  storeId: StoreId,
  overrides: StoreOverrides | null
): RecentAnalyticsRecord[] {
  const anchorEnd = getStoreAnalyticsAnchorEnd(getWalmartBundle(storeId).config);
  const window = getRecentAnalyticsWindow(anchorEnd);

  if (overrides?.recentAnalytics?.records?.length) {
    return filterRecordsToWindow(overrides.recentAnalytics.records, window).sort(
      (a, b) => b.date.localeCompare(a.date)
    );
  }

  const base = getWalmartBundle(storeId);
  let rows = base.tableRows;
  if (overrides?.walmart?.tableRows) {
    rows = overrides.walmart.tableRows;
  }
  return walmartRowsToRecords(rows, window.start);
}

export function buildOverridesFromRecentRecords(
  storeId: StoreId,
  records: RecentAnalyticsRecord[],
  existing: StoreOverrides | null
): StoreOverrides {
  const anchorEnd = getStoreAnalyticsAnchorEnd(getWalmartBundle(storeId).config);
  const window = getRecentAnalyticsWindow(anchorEnd);
  const inWindow = filterRecordsToWindow(records, window);

  const next: StoreOverrides = {
    ...existing,
    recentAnalytics: {
      records: inWindow.sort((a, b) => a.date.localeCompare(b.date)),
      windowEnd: anchorEnd,
    },
  };

  const base = getWalmartBundle(storeId);
  const merged = mergeRecentAnalyticsIntoWalmartBundle(base, {
    ...next,
    recentAnalytics: next.recentAnalytics,
  });
  next.walmart = {
    ...existing?.walmart,
    tableRows: merged,
  };

  return next;
}
