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
        hostname: "m.media-amazon.com",
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
        source: "/amazon",
        destination: "/store/amazon-chokebody/dashboard/sales",
        permanent: false,
      },
      {
        source: "/amazon/dashboard/sales",
        destination: "/store/amazon-chokebody/dashboard/sales",
        permanent: false,
      },
      {
        source: "/amazon/reports/:slug",
        destination: "/store/amazon-chokebody/reports/:slug",
        permanent: false,
      },
      {
        source: "/walmart",
        destination: "/store/walmart-main/analytics/sales-insights",
        permanent: false,
      },
      {
        source: "/walmart/analytics/sales-insights",
        destination: "/store/walmart-main/analytics/sales-insights",
        permanent: false,
      },
      {
        source: "/walmart/analytics/sales-insights/:path*",
        destination: "/store/walmart-main/analytics/sales-insights/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
