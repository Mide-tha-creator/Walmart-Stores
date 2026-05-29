export interface RecentAnalyticsRecord {
  date: string;
  totalSales: number;
  unitsSold: number;
  orders?: number;
  sessions?: number;
  conversionRate?: number;
}

export interface RecentAnalyticsOverrides {
  records: RecentAnalyticsRecord[];
  windowEnd?: string;
}

export interface RecentAnalyticsWindow {
  /** First editable day (start of month, 5 months before anchor). */
  start: string;
  /** Last day of generated mock data; dates after this can be added without limit. */
  anchorEnd: string;
}
