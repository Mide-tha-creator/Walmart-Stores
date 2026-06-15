import { getWalmartBundle } from "@/data/stores/registry";
import { isValidStoreId } from "@/config/stores/registry";
import { deepMerge } from "@/lib/store/merge-overrides";
import { mergeRecentAnalyticsIntoWalmartBundle } from "@/lib/store/recent-analytics-merge";
import { getStoreOverridesKey } from "@/lib/store/storage-keys";
import type { StoreId } from "@/config/stores/types";
import type { StoreOverrides, WalmartStoreDataBundle } from "@/types/store-data";

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
