import type {
  AccountSalesSummary,
  DailySalesRow,
  WalmartMetricKey,
} from "@/types/walmart";
import type { RecentAnalyticsOverrides } from "@/types/recent-analytics";

export interface WalmartDefaultSummary {
  gmv: number;
  unitsSold: number;
  orders: number;
  aur: number;
}

export type WalmartTimeSeriesProfile =
  | "baseline"
  | "spike-collapse"
  | "volatile-bursts";

export interface WalmartStoreDataConfig {
  timeSeriesSeed: number;
  timeSeriesProfile?: WalmartTimeSeriesProfile;
  rangeStart: string;
  rangeEnd: string;
  defaultSummary?: WalmartDefaultSummary;
}

export interface WalmartStoreDataBundle {
  config: WalmartStoreDataConfig;
  summary: AccountSalesSummary;
  timeSeries: Record<WalmartMetricKey, { date: string; value: number }[]>;
  tableRows: DailySalesRow[];
}

export interface StoreOverrides {
  recentAnalytics?: RecentAnalyticsOverrides;
  meta?: {
    displayName?: string;
  };
  walmart?: {
    summary?: Partial<AccountSalesSummary>;
    timeSeries?: Record<WalmartMetricKey, { date: string; value: number }[]>;
    tableRows?: DailySalesRow[];
  };
}
