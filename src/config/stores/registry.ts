import { walmartMainConfig } from "@/config/stores/walmart-main";
import { walmartSecondConfig } from "@/config/stores/walmart-second";
import { getFullHistoryDashboardDateRange } from "@/lib/store/rolling-dashboard-range";
import type { DateRange } from "@/types/common";
import type { StoreConfig, StoreId } from "@/config/stores/types";

export { getStorePath } from "@/lib/navigation/routes";

const STORE_MAP: Record<StoreId, StoreConfig> = {
  "walmart-main": walmartMainConfig,
  "walmart-second": walmartSecondConfig,
};

export const STORE_IDS = Object.keys(STORE_MAP) as StoreId[];

export const ALL_STORES: StoreConfig[] = STORE_IDS.map((id) => STORE_MAP[id]);

export function isValidStoreId(id: string): id is StoreId {
  return id in STORE_MAP;
}

export function getStoreConfig(storeId: string): StoreConfig {
  if (!isValidStoreId(storeId)) {
    throw new Error(`Unknown store: ${storeId}`);
  }
  return STORE_MAP[storeId];
}

/** Full history through today for dashboard charts and KPIs (start from store config). */
export function getStoreDefaultDateRange(storeId: StoreId): DateRange {
  const { defaultDateRange } = getStoreConfig(storeId);
  return getFullHistoryDashboardDateRange(defaultDateRange.start);
}
