import { format, parseISO, subDays } from "date-fns";
import type { DateRange } from "@/types/common";

/** Default visible window on marketplace dashboards. */
export const ROLLING_DASHBOARD_DAYS = 30;

/** Demo anchor date — all store history and tables extend through this day. */
export const DEMO_AS_OF_DATE = "2026-06-26";

function getDemoAsOfDate(): Date {
  return parseISO(DEMO_AS_OF_DATE);
}

export function getTodayIso(asOf: Date = getDemoAsOfDate()): string {
  return format(asOf, "yyyy-MM-dd");
}

/** Last N days through today (inclusive of today as end). */
export function getRollingDashboardDateRange(
  days: number = ROLLING_DASHBOARD_DAYS,
  asOf: Date = getDemoAsOfDate()
): DateRange {
  return {
    start: format(subDays(asOf, days), "yyyy-MM-dd"),
    end: format(asOf, "yyyy-MM-dd"),
  };
}

/** Full store history from a fixed start date through today. */
export function getFullHistoryDashboardDateRange(
  startDate: string,
  asOf: Date = getDemoAsOfDate()
): DateRange {
  return {
    start: startDate,
    end: format(asOf, "yyyy-MM-dd"),
  };
}
