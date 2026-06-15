import { getAmazonSalesDashboardPath } from "@/lib/navigation/routes";
import { getRollingDashboardDateRange } from "@/lib/store/rolling-dashboard-range";
import type { StoreConfig } from "@/config/stores/types";

export const amazonNovaConfig: StoreConfig = {
  id: "amazon-nova",
  name: "Kursat",
  marketplace: "amazon",
  template: "amazon-sales",
  description:
    "Kursat catalog with Seller Central sales dashboard, ASIN performance insights, and market comparisons.",
  logo: {
    src: "/brands/amazon-seller-central.png",
    alt: "Amazon Seller Central",
  },
  branding: {
    primary: "#008296",
    primaryHover: "#006b7a",
    topnavBg: "#002f36",
    pageBg: "#f0f8f9",
    sidebarBg: "#f0f2f2",
    chartAccent: "#008296",
  },
  defaultDateRange: { start: "2024-08-14", end: getRollingDashboardDateRange().end },
  regionLabel: "United States",
  routes: { home: getAmazonSalesDashboardPath("amazon-nova") },
  dashboard: {
    asinTitle: "Deep dive your ASIN performance",
    asinComparisonLabel:
      "Comparing Monday-Sunday ending June 8, 2026 to similar ASINs",
    defaultAsinCategory: "below_market_average",
    asinLayout: "horizontal",
  },
};
