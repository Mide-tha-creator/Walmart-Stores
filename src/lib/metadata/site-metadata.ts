import type { Metadata } from "next";
import type { StoreConfig } from "@/config/stores/types";

export const PLATFORM_TITLE = "Seller Analytics Platform";
export const WALMART_TAB_TITLE = "Sales Insights | Walmart seller central";

export const PLATFORM_DESCRIPTION =
  "Sales performance and analytics for Walmart seller operations.";

export const WALMART_DESCRIPTION =
  "Account sales insights, GMV trends, and performance reporting for Walmart Seller Center.";

/** Bump when a favicon asset changes so browsers refetch instead of using a cached icon. */
const FAVICON_VERSION = "5";

export const WALMART_FAVICON = `/favicons/walmart-seller-center.png?v=${FAVICON_VERSION}`;

export function getStoreIconsMetadata(): NonNullable<Metadata["icons"]> {
  return {
    icon: [{ url: WALMART_FAVICON, type: "image/png", sizes: "32x32" }],
    shortcut: WALMART_FAVICON,
  };
}

export function getStorePageMetadata(config: StoreConfig): Metadata {
  void config;
  return {
    title: WALMART_TAB_TITLE,
    description: WALMART_DESCRIPTION,
    icons: getStoreIconsMetadata(),
    openGraph: {
      title: WALMART_TAB_TITLE,
      description: WALMART_DESCRIPTION,
      siteName: "Walmart Seller Center",
    },
  };
}

export const rootPlatformMetadata: Metadata = {
  title: {
    default: WALMART_TAB_TITLE,
    template: "%s",
  },
  description: PLATFORM_DESCRIPTION,
  applicationName: "Seller Analytics Platform",
  icons: getStoreIconsMetadata(),
  openGraph: {
    title: PLATFORM_TITLE,
    description: PLATFORM_DESCRIPTION,
  },
};
