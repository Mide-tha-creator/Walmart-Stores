import type { StoreId } from "@/config/stores/types";

/** Enterprise account slugs used in public URLs (not internal store IDs). */
export const ACCOUNT_SLUGS = {
  "us-marketplace": "walmart-main",
  "us-marketplace-2": "walmart-second",
} as const satisfies Record<string, StoreId>;

export type AccountSlug = keyof typeof ACCOUNT_SLUGS;

export const DEFAULT_WALMART_ACCOUNT: AccountSlug = "us-marketplace";

const STORE_TO_ACCOUNT: Record<StoreId, AccountSlug> = {
  "walmart-main": "us-marketplace",
  "walmart-second": "us-marketplace-2",
};

export function getAccountSlug(storeId: StoreId): AccountSlug {
  return STORE_TO_ACCOUNT[storeId];
}

export function isValidAccountSlug(slug: string): slug is AccountSlug {
  return slug in ACCOUNT_SLUGS;
}

export function resolveAccountToStoreId(account: string): StoreId | null {
  if (!isValidAccountSlug(account)) return null;
  return ACCOUNT_SLUGS[account];
}

export function getAllAccountSlugs(): AccountSlug[] {
  return Object.keys(ACCOUNT_SLUGS) as AccountSlug[];
}
