import type {
  AsinAlert,
  BusinessInsight,
  CompareSalesAggregate,
  SalesSnapshot,
  SalesTimeSeriesPoint,
} from "@/types/amazon";
import type {
  AccountSalesSummary,
  DailySalesRow,
  WalmartMetricKey,
} from "@/types/walmart";
import type { RecentAnalyticsOverrides } from "@/types/recent-analytics";

export interface AmazonAdsMetrics {
  spend: number;
  roas: number;
  acos: number;
}

export interface AmazonConversionMetrics {
  rate: number;
  sessions: number;
}

export type AmazonTimeSeriesProfile =
  | "enterprise-decline"
  | "midmarket-growth"
  | "enterprise-twin-peak"
  | "midmarket-spike-decline";

export interface AmazonStoreDataConfig {
  timeSeriesSeed: number;
  timeSeriesMultiplier: number;
  timeSeriesProfile?: AmazonTimeSeriesProfile;
  seriesStart: string;
  seriesEnd: string;
  insights: BusinessInsight;
  asinAlerts: AsinAlert[];
  ads: AmazonAdsMetrics;
  conversion: AmazonConversionMetrics;
  defaultAggregate?: CompareSalesAggregateDefaults;
}

export interface AmazonStoreDataBundle {
  config: AmazonStoreDataConfig;
  fullTimeSeries: SalesTimeSeriesPoint[];
}

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

export interface CompareSalesAggregateDefaults {
  label: string;
  totalOrderItems: number;
  unitsOrdered: number;
  orderedProductSales: number;
  avgUnitsPerOrderItem: number;
  avgSalesPerOrderItem: number;
}

export interface StoreOverrides {
  recentAnalytics?: RecentAnalyticsOverrides;
  meta?: {
    displayName?: string;
  };
  amazon?: {
    snapshot?: Partial<SalesSnapshot>;
    aggregate?: Partial<CompareSalesAggregate>;
    timeSeries?: SalesTimeSeriesPoint[];
    insights?: BusinessInsight;
    asinAlerts?: AsinAlert[];
    ads?: Partial<AmazonAdsMetrics>;
    conversion?: Partial<AmazonConversionMetrics>;
  };
  walmart?: {
    summary?: Partial<AccountSalesSummary>;
    timeSeries?: Record<WalmartMetricKey, { date: string; value: number }[]>;
    tableRows?: DailySalesRow[];
  };
}
