import { format, isValid, parseISO, startOfMonth, subMonths } from "date-fns";
import type { RecentAnalyticsRecord, RecentAnalyticsWindow } from "@/types/recent-analytics";

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
  marketplace: "amazon" | "walmart",
  config: { seriesEnd?: string; rangeEnd?: string }
): string {
  if (marketplace === "amazon") {
    return config.seriesEnd ?? config.rangeEnd ?? format(new Date(), "yyyy-MM-dd");
  }
  return config.rangeEnd ?? config.seriesEnd ?? format(new Date(), "yyyy-MM-dd");
}
