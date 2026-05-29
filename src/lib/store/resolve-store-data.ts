import { getAmazonBundle, getWalmartBundle } from "@/data/stores/registry";
import { isValidStoreId } from "@/config/stores/registry";
import { deepMerge } from "@/lib/store/merge-overrides";
import {
  mergeRecentAnalyticsIntoAmazonBundle,
  mergeRecentAnalyticsIntoWalmartBundle,
} from "@/lib/store/recent-analytics-merge";
import {
  getRecentAnalyticsWindow,
  getStoreAnalyticsAnchorEnd,
  isDateInRecentWindow,
} from "@/lib/store/recent-analytics-window";
import { getStoreOverridesKey } from "@/lib/store/storage-keys";
import type { StoreId } from "@/config/stores/types";
import type { AmazonStoreDataBundle, StoreOverrides, WalmartStoreDataBundle } from "@/types/store-data";

export function loadStoreOverrides(storeId: string): StoreOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStoreOverridesKey(storeId));
    if (!raw) return null;
    return JSON.parse(raw) as StoreOverrides;
  } catch {
    return null;
  }
}

export function saveStoreOverrides(storeId: string, overrides: StoreOverrides): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStoreOverridesKey(storeId), JSON.stringify(overrides));
  import("@/lib/store/use-display-store-config").then(({ notifyStoreOverridesUpdated }) => {
    notifyStoreOverridesUpdated();
  });
}

export function clearStoreOverrides(storeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStoreOverridesKey(storeId));
}

export function getResolvedAmazonBundle(storeId: StoreId): AmazonStoreDataBundle {
  const base = getAmazonBundle(storeId);
  const allOverrides = loadStoreOverrides(storeId);
  const overrides = allOverrides?.amazon;
  if (!allOverrides && !overrides) return base;

  let fullTimeSeries = base.fullTimeSeries;

  const hasRecent = Boolean(allOverrides?.recentAnalytics?.records?.length);
  if (overrides?.timeSeries && !hasRecent) {
    fullTimeSeries = overrides.timeSeries;
  } else {
    fullTimeSeries = mergeRecentAnalyticsIntoAmazonBundle(base, allOverrides);
    if (overrides?.timeSeries && hasRecent) {
      const anchorEnd = getStoreAnalyticsAnchorEnd("amazon", base.config);
      const window = getRecentAnalyticsWindow(anchorEnd);
      const legacyMap = new Map(overrides.timeSeries.map((p) => [p.date, p]));
      fullTimeSeries = fullTimeSeries.map((p) => {
        if (isDateInRecentWindow(p.date, window)) return p;
        return legacyMap.get(p.date) ?? p;
      });
    }
  }

  if (!overrides) {
    return {
      ...base,
      fullTimeSeries,
    };
  }

  return {
    config: deepMerge(base.config, {
      insights: overrides.insights,
      asinAlerts: overrides.asinAlerts,
      ads: overrides.ads ? deepMerge(base.config.ads, overrides.ads) : undefined,
      conversion: overrides.conversion
        ? deepMerge(base.config.conversion, overrides.conversion)
        : undefined,
    }),
    fullTimeSeries,
  };
}

export function getResolvedWalmartBundle(storeId: StoreId): WalmartStoreDataBundle {
  const base = getWalmartBundle(storeId);
  const allOverrides = loadStoreOverrides(storeId);
  const overrides = allOverrides?.walmart;
  if (!allOverrides && !overrides) return base;

  const tableRows = mergeRecentAnalyticsIntoWalmartBundle(base, allOverrides);

  if (!overrides) {
    return {
      ...base,
      tableRows,
    };
  }

  return {
    config: base.config,
    summary: overrides.summary
      ? deepMerge(base.summary, overrides.summary)
      : base.summary,
    timeSeries: overrides.timeSeries
      ? deepMerge(base.timeSeries, overrides.timeSeries)
      : base.timeSeries,
    tableRows,
  };
}

export function getAllOverridesForAdmin(storeId: string): StoreOverrides {
  if (!isValidStoreId(storeId)) return {};
  return loadStoreOverrides(storeId) ?? {};
}
