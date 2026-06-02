import type { Metadata } from "next";
import type { StoreConfig } from "@/config/stores/types";

export const PLATFORM_TITLE = "Seller Analytics Platform";
export const AMAZON_TAB_TITLE = "Business Reports";
export const WALMART_TAB_TITLE = "Sales Insights | Walmart seller central";

export const PLATFORM_DESCRIPTION =
  "Business reports, sales performance, and marketplace analytics for seller operations.";

export const AMAZON_DESCRIPTION =
  "Sales dashboard, business reports, and ASIN performance metrics for Amazon Seller Central.";

export const WALMART_DESCRIPTION =
  "Account sales insights, GMV trends, and performance reporting for Walmart Seller Center.";

export const STORE_FAVICON = {
  amazon: "/favicons/amazon.png",
  walmart: "/favicons/walmart-seller-center.png",
} as const;

export function getStoreIconsMetadata(
  marketplace: StoreConfig["marketplace"]
): NonNullable<Metadata["icons"]> {
  const href =
    marketplace === "amazon" ? STORE_FAVICON.amazon : STORE_FAVICON.walmart;
  return {
    icon: [{ url: href, type: "image/png", sizes: "32x32" }],
    shortcut: href,
  };
}

export function getMarketplaceTabTitle(
  marketplace: StoreConfig["marketplace"]
): string {
  return marketplace === "amazon" ? AMAZON_TAB_TITLE : WALMART_TAB_TITLE;
}

export function getMarketplaceDescription(
  marketplace: StoreConfig["marketplace"]
): string {
  return marketplace === "amazon" ? AMAZON_DESCRIPTION : WALMART_DESCRIPTION;
}

export function getStorePageMetadata(config: StoreConfig): Metadata {
  return {
    title: getMarketplaceTabTitle(config.marketplace),
    description: getMarketplaceDescription(config.marketplace),
    icons: getStoreIconsMetadata(config.marketplace),
    openGraph: {
      title: getMarketplaceTabTitle(config.marketplace),
      description: getMarketplaceDescription(config.marketplace),
      siteName:
        config.marketplace === "amazon"
          ? "Amazon Seller Central"
          : "Walmart Seller Center",
    },
  };
}

export const rootPlatformMetadata: Metadata = {
  title: {
    default: PLATFORM_TITLE,
    template: "%s",
  },
  description: PLATFORM_DESCRIPTION,
  applicationName: "Seller Analytics Platform",
  openGraph: {
    title: PLATFORM_TITLE,
    description: PLATFORM_DESCRIPTION,
  },
};
