import { getAmazonSalesDashboardPath } from "@/lib/navigation/routes";
import { getRollingDashboardDateRange } from "@/lib/store/rolling-dashboard-range";
import type { StoreConfig } from "@/config/stores/types";

export const amazonChokebodyConfig: StoreConfig = {
  id: "amazon-chokebody",
  name: "Chokebody Enterprise",
  marketplace: "amazon",
  template: "amazon-sales",
  description:
    "Fitness & wellness catalog with full Sales Dashboard, Business Reports, and ASIN performance insights.",
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
  defaultDateRange: { start: "2024-05-16", end: getRollingDashboardDateRange().end },
  regionLabel: "United States",
  routes: { home: getAmazonSalesDashboardPath("amazon-chokebody") },
  dashboard: {
    asinTitle: "Deep dive into your sales",
    asinComparisonLabel: "Compared to prior week (June 2 – June 8, 2026)",
    defaultAsinCategory: "declining_sales",
    asinLayout: "carousel",
  },
};
