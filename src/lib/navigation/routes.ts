import {
  DEFAULT_WALMART_ACCOUNT,
  getAccountSlug,
  type AccountSlug,
} from "@/lib/navigation/account-registry";
import type { StoreId } from "@/config/stores/types";

export type WalmartInsightsTab =
  | "account-sales"
  | "item-performance"
  | "department-performance";

const LEGACY_WALMART_TAB_PATHS: Record<string, WalmartInsightsTab> = {
  "/analytics/sales-insights": "account-sales",
  "/analytics/sales-insights/item": "item-performance",
  "/analytics/sales-insights/department": "department-performance",
};

export function getWalmartInsightsPath(
  storeId: StoreId,
  tab: WalmartInsightsTab = "account-sales",
  account: AccountSlug = getAccountSlug(storeId)
): string {
  return `/analytics/accounts/${account}/sales-insights/${tab}`;
}

export function getDefaultWalmartHomePath(): string {
  return `/analytics/accounts/${DEFAULT_WALMART_ACCOUNT}/sales-insights/account-sales`;
}

/** Maps legacy in-app path suffixes to enterprise URLs. */
export function getStorePath(storeId: StoreId, path: string): string {
  const walmartTab = LEGACY_WALMART_TAB_PATHS[path];
  if (walmartTab) {
    return getWalmartInsightsPath(storeId, walmartTab);
  }

  if (path === "/analytics/search-insights") {
    return getWalmartInsightsPath(storeId, "account-sales");
  }

  if (path.startsWith("/analytics/sales-insights/")) {
    const tab = path.slice("/analytics/sales-insights/".length) as WalmartInsightsTab;
    if (
      tab === "account-sales" ||
      tab === "item-performance" ||
      tab === "department-performance"
    ) {
      return getWalmartInsightsPath(storeId, tab);
    }
  }

  return path;
}
