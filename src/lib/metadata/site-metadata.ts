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

/** Bump when favicon assets change to defeat browser cache. */
export const FAVICON_CACHE_VERSION = "4";

export const FAVICON = {
  default: "/favicons/seller-platform.svg",
  amazon: `/favicons/amazon-seller-central.png?v=${FAVICON_CACHE_VERSION}`,
  walmart: `/favicons/walmart-seller-center.png?v=${FAVICON_CACHE_VERSION}`,
} as const;

export function getPlatformIconsMetadata(): NonNullable<Metadata["icons"]> {
  return {
    icon: [{ url: FAVICON.default, type: "image/svg+xml" }],
    shortcut: FAVICON.default,
  };
}

export function getStoreIconsMetadata(
  marketplace: StoreConfig["marketplace"]
): NonNullable<Metadata["icons"]> {
  const href = marketplace === "amazon" ? FAVICON.amazon : FAVICON.walmart;
  const type = marketplace === "amazon" ? "image/png" : "image/png";
  return {
    icon: [
      { url: href, type, sizes: "32x32" },
      { url: href, type, sizes: "192x192" },
    ],
    shortcut: href,
    apple: href,
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
