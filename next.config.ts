import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/walmart",
        destination: "/analytics/sales-insights/account-sales",
        permanent: false,
      },
      {
        source: "/walmart/analytics/sales-insights",
        destination: "/analytics/sales-insights/account-sales",
        permanent: false,
      },
      {
        source: "/walmart/analytics/sales-insights/item",
        destination: "/analytics/sales-insights/item-performance",
        permanent: false,
      },
      {
        source: "/walmart/analytics/sales-insights/department",
        destination: "/analytics/sales-insights/department-performance",
        permanent: false,
      },
      {
        source: "/walmart/analytics/sales-insights/:path*",
        destination: "/analytics/sales-insights/account-sales",
        permanent: false,
      },
      {
        source: "/store/walmart-main/analytics/sales-insights",
        destination:
          "/analytics/accounts/us-marketplace/sales-insights/account-sales",
        permanent: false,
      },
      {
        source: "/store/walmart-main/analytics/sales-insights/item",
        destination:
          "/analytics/accounts/us-marketplace/sales-insights/item-performance",
        permanent: false,
      },
      {
        source: "/store/walmart-main/analytics/sales-insights/department",
        destination:
          "/analytics/accounts/us-marketplace/sales-insights/department-performance",
        permanent: false,
      },
      {
        source: "/store/walmart-second/analytics/sales-insights",
        destination:
          "/analytics/accounts/us-marketplace-2/sales-insights/account-sales",
        permanent: false,
      },
      {
        source: "/store/walmart-second/analytics/sales-insights/item",
        destination:
          "/analytics/accounts/us-marketplace-2/sales-insights/item-performance",
        permanent: false,
      },
      {
        source: "/store/walmart-second/analytics/sales-insights/department",
        destination:
          "/analytics/accounts/us-marketplace-2/sales-insights/department-performance",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
