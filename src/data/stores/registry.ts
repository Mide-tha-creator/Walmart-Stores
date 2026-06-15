import { buildWalmartMainBundle } from "@/data/stores/walmart-main/sales-insights";
import { buildWalmartSecondBundle } from "@/data/stores/walmart-second/sales-insights";
import type { StoreId } from "@/config/stores/types";
import type { WalmartStoreDataBundle } from "@/types/store-data";

export function getWalmartBundle(storeId: StoreId): WalmartStoreDataBundle {
  switch (storeId) {
    case "walmart-main":
      return buildWalmartMainBundle();
    case "walmart-second":
      return buildWalmartSecondBundle();
    default:
      throw new Error(`${storeId} is not a Walmart store`);
  }
}
