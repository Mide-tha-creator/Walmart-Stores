import { format, isValid, parseISO, startOfMonth, subMonths } from "date-fns";
import { getTodayIso } from "@/lib/store/rolling-dashboard-range";
import type { RecentAnalyticsRecord, RecentAnalyticsWindow } from "@/types/recent-analytics";
import type { WalmartStoreDataConfig } from "@/types/store-data";

/** Months of history editable before the data anchor. */
export const EDITABLE_PAST_MONTHS = 5;

export function getRecentAnalyticsWindow(anchorEnd: string): RecentAnalyticsWindow {
  const anchorDate = parseISO(anchorEnd);
  const anchor = isValid(anchorDate) ? anchorDate : new Date();
  const startDate = startOfMonth(subMonths(anchor, EDITABLE_PAST_MONTHS));

  return {
    start: format(startDate, "yyyy-MM-dd"),
    anchorEnd: format(anchor, "yyyy-MM-dd"),
  };
}

export function isDateInRecentWindow(
  date: string,
  window: RecentAnalyticsWindow
): boolean {
  return date >= window.start;
}

export function isLockedHistoricalDate(
  date: string,
  window: RecentAnalyticsWindow
): boolean {
  return date < window.start;
}

export function filterRecordsToWindow(
  records: RecentAnalyticsRecord[],
  window: RecentAnalyticsWindow
): RecentAnalyticsRecord[] {
  return records.filter((r) => isDateInRecentWindow(r.date, window));
}

export function getStoreAnalyticsAnchorEnd(
  _config?: Pick<WalmartStoreDataConfig, "rangeEnd">
): string {
  void _config;
  return getTodayIso();
}
