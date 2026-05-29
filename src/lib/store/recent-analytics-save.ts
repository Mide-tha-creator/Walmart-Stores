import type {
  RecentAnalyticsRecord,
  RecentAnalyticsWindow,
} from "@/types/recent-analytics";
import {
  filterRecordsToWindow,
  isDateInRecentWindow,
} from "@/lib/store/recent-analytics-window";
import { normalizeTableRowDate } from "@/lib/store/walmart-table-rows";

export function validateRecentAnalyticsRecords(
  records: RecentAnalyticsRecord[],
  window: RecentAnalyticsWindow
): { ok: true; records: RecentAnalyticsRecord[] } | { ok: false; error: string } {
  const inWindow = filterRecordsToWindow(records, window);
  const dates = new Set<string>();

  for (const r of inWindow) {
    const date = normalizeTableRowDate(r.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { ok: false, error: `Invalid date: ${r.date}` };
    }
    if (!isDateInRecentWindow(date, window)) {
      return { ok: false, error: `Date ${date} is outside the editable window.` };
    }
    if (dates.has(date)) {
      return { ok: false, error: `Duplicate date: ${date}` };
    }
    dates.add(date);
    if (r.totalSales < 0 || r.unitsSold < 0) {
      return { ok: false, error: `Negative values are not allowed for ${date}.` };
    }
  }

  return {
    ok: true,
    records: inWindow.map((r) => ({
      ...r,
      date: normalizeTableRowDate(r.date),
      totalSales: Math.round(r.totalSales * 100) / 100,
      unitsSold: Math.round(r.unitsSold),
    })),
  };
}
