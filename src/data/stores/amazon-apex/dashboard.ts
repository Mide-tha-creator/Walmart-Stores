import { buildAmazonBundle } from "@/data/stores/build-amazon-bundle";
import type { AmazonStoreDataConfig } from "@/types/store-data";

export const amazonApexDataConfig: AmazonStoreDataConfig = {
  timeSeriesSeed: 101,
  timeSeriesMultiplier: 1.12,
  timeSeriesProfile: "enterprise-twin-peak",
  seriesStart: "2024-05-15",
  seriesEnd: "2026-06-15",
  defaultAggregate: {
    label: "Selected date range",
    totalOrderItems: 444796,
    unitsOrdered: 486384,
    orderedProductSales: 10228987.0,
    avgUnitsPerOrderItem: 1.09,
    avgSalesPerOrderItem: 23.0,
  },
  insights: {
    id: "sanabul-insights",
    paragraphs: [
      "In April 2026, your ordered product sales reached $445K, up approximately 18% year over year. Units ordered totaled 18,420 for the month with strong demand across boxing gloves and training gear.",
      "Marketplace total sales for the selected date range reached $10.2M on 486,034 units ordered, with average sales per order item holding near $23.00.",
      "Review Products with Growth Opportunities in the ASIN carousel—several Sanabul glove SKUs show a measurable sales gap versus similar ASINs in your category.",
    ],
  },
  asinAlerts: [
    {
      asin: "B07VZ8K9M2",
      title: "Sanabul Easter Egg Boxing Gloves for Kids",
      imageUrl: "/products/sanabul-gloves-1.png",
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $12,450 when compared to similar ASINs",
      deltaAmount: 12450,
    },
    {
      asin: "B08N5WRWNW",
      title: "Sanabul Essential Gel Boxing Gloves",
      imageUrl: "/products/sanabul-gloves-2.png",
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $8,920 when compared to similar ASINs",
      deltaAmount: 8920,
    },
    {
      asin: "B09GXP4KLM",
      title: "Sanabul Battle Forged MMA Gloves",
      imageUrl: "/products/sanabul-gloves-3.png",
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $6,340 when compared to similar ASINs",
      deltaAmount: 6340,
    },
    {
      asin: "B07HJF26M5",
      title: "Sanabul Professional Boxing Gloves 16oz",
      imageUrl: "/products/sanabul-gloves-4.png",
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $5,180 when compared to similar ASINs",
      deltaAmount: 5180,
    },
    {
      asin: "B08TENT001",
      title: "Sanabul Hand Wraps 180 Inch Elastic",
      imageUrl:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=120&fit=crop",
      category: "declining_sales",
      metricLabel: "$892.10 decline in ordered product sales",
      deltaAmount: -892.1,
    },
    {
      asin: "B09PACK202",
      title: "Sanabul Shin Guards for Muay Thai",
      imageUrl:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&h=120&fit=crop",
      category: "increasing_sales",
      metricLabel: "$1,240.50 increase in ordered product sales",
      deltaAmount: 1240.5,
    },
    {
      asin: "B07HYD303",
      title: "Sanabul Focus Mitts Pro Pair",
      imageUrl:
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=120&h=120&fit=crop",
      category: "increasing_traffic",
      metricLabel: "12% increase in page views",
      deltaAmount: 456.3,
    },
    {
      asin: "B09ABC5678",
      title: "Sanabul Jump Rope Speed Cable",
      imageUrl:
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=120&h=120&fit=crop",
      category: "declining_traffic",
      metricLabel: "8% decline in page views",
      deltaAmount: -298.15,
    },
  ],
  ads: { spend: 428500, roas: 4.8, acos: 12.4 },
  conversion: { rate: 15.8, sessions: 1240000 },
};

export const amazonApexBundle = buildAmazonBundle(amazonApexDataConfig);
