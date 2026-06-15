import { buildAmazonBundle } from "@/data/stores/build-amazon-bundle";
import type { AmazonStoreDataConfig } from "@/types/store-data";

export const amazonNovaDataConfig: AmazonStoreDataConfig = {
  timeSeriesSeed: 207,
  timeSeriesMultiplier: 0.62,
  timeSeriesProfile: "midmarket-spike-decline",
  seriesStart: "2024-08-14",
  seriesEnd: "2026-06-15",
  defaultAggregate: {
    label: "Selected date range",
    totalOrderItems: 19450,
    unitsOrdered: 22806,
    orderedProductSales: 490535.84,
    avgUnitsPerOrderItem: 1.17,
    avgSalesPerOrderItem: 25.21,
  },
  insights: {
    id: "kursat-insights",
    paragraphs: [
      "In April 2026, your ordered product sales reached $326, down approximately 97% year over year. Units ordered totaled 24 for the month—a near-complete collapse compared to the prior year.",
      "For the selected date range, ordered product sales totaled $487,735.84 on 22,686 units with an average of $25.21 per order item. Performance peaked in mid-2025 before declining sharply starting in late 2025.",
      "Review Products Below Market Average in the ASIN carousel—several SKUs show measurable gaps versus similar listings in your category.",
    ],
  },
  asinAlerts: [
    {
      asin: "B0F7JMBW44",
      title: "AOZORA HOME Matcha Whisk Set",
      imageUrl: "/products/kursat-matcha-whisk-set.png",
      category: "below_market_average",
      metricLabel:
        "Last week sales were $47.81 below the market average for similar ASINs",
      deltaAmount: -47.81,
    },
    {
      asin: "B08KIT100",
      title: "Bamboo Drawer Organizer Expandable",
      imageUrl:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d4046?w=120&h=120&fit=crop",
      category: "below_market_average",
      metricLabel:
        "Last week sales were $32.15 below the market average for similar ASINs",
      deltaAmount: -32.15,
    },
    {
      asin: "B09LMP200",
      title: "Smart LED Desk Lamp Dimmable",
      imageUrl:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=120&h=120&fit=crop",
      category: "top_sales_products",
      metricLabel: "$1,124.50 in ordered product sales last week",
      deltaAmount: 1124.5,
    },
    {
      asin: "B07THR300",
      title: "Memory Foam Bath Mat Set 2-Pack",
      imageUrl:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&h=120&fit=crop",
      category: "declining_sales",
      metricLabel: "$334.20 decline in ordered product sales",
      deltaAmount: -334.2,
    },
    {
      asin: "B08ORG400",
      title: "Countertop Spice Rack 3-Tier",
      imageUrl:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d4046?w=120&h=120&fit=crop",
      category: "increasing_sales",
      metricLabel: "$456.80 increase in ordered product sales",
      deltaAmount: 456.8,
    },
    {
      asin: "B09TRA500",
      title: "Under-Shelf Basket Wire 2-Pack",
      imageUrl:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=120&h=120&fit=crop",
      category: "declining_traffic",
      metricLabel: "14% decline in page views",
      deltaAmount: -14,
    },
    {
      asin: "B07LMP600",
      title: "Glass Food Storage Containers 12-Piece",
      imageUrl:
        "https://images.unsplash.com/photo-1585515320310-259814833e62?w=120&h=120&fit=crop",
      category: "increasing_traffic",
      metricLabel: "9% increase in page views",
      deltaAmount: 9,
    },
  ],
  ads: { spend: 28400, roas: 3.8, acos: 16.5 },
  conversion: { rate: 11.8, sessions: 312000 },
};

export const amazonNovaBundle = buildAmazonBundle(amazonNovaDataConfig);
