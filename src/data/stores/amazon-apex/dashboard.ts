import { buildAmazonBundle } from "@/data/stores/build-amazon-bundle";
import { getProductImageUrl } from "@/lib/catalog/product-image-url";
import type { AmazonStoreDataConfig } from "@/types/store-data";

export const amazonApexDataConfig: AmazonStoreDataConfig = {
  timeSeriesSeed: 101,
  timeSeriesMultiplier: 1.12,
  timeSeriesProfile: "enterprise-twin-peak",
  seriesStart: "2024-05-15",
  seriesEnd: "2026-05-14",
  defaultAggregate: {
    label: "Selected date range",
    totalOrderItems: 444476,
    unitsOrdered: 486034,
    orderedProductSales: 10221487.0,
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
      imageUrl: getProductImageUrl("B07VZ8K9M2"),
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $12,450 when compared to similar ASINs",
      deltaAmount: 12450,
    },
    {
      asin: "B08N5WRWNW",
      title: "Sanabul Essential Gel Boxing Gloves",
      imageUrl: getProductImageUrl("B08N5WRWNW"),
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $8,920 when compared to similar ASINs",
      deltaAmount: 8920,
    },
    {
      asin: "B09GXP4KLM",
      title: "Sanabul Battle Forged MMA Gloves",
      imageUrl: getProductImageUrl("B09GXP4KLM"),
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $6,340 when compared to similar ASINs",
      deltaAmount: 6340,
    },
    {
      asin: "B07HJF26M5",
      title: "Sanabul Professional Boxing Gloves 16oz",
      imageUrl: getProductImageUrl("B07HJF26M5"),
      category: "growth_opportunities",
      metricLabel:
        "This ASIN has a sales gap of $5,180 when compared to similar ASINs",
      deltaAmount: 5180,
    },
    {
      asin: "B08TENT001",
      title: "Sanabul Hand Wraps 180 Inch Elastic",
      imageUrl: getProductImageUrl("B08TENT001"),
      category: "declining_sales",
      metricLabel: "$892.10 decline in ordered product sales",
      deltaAmount: -892.1,
    },
    {
      asin: "B09PACK202",
      title: "Sanabul Shin Guards for Muay Thai",
      imageUrl: getProductImageUrl("B09PACK202"),
      category: "increasing_sales",
      metricLabel: "$1,240.50 increase in ordered product sales",
      deltaAmount: 1240.5,
    },
    {
      asin: "B07HYD303",
      title: "Sanabul Focus Mitts Pro Pair",
      imageUrl: getProductImageUrl("B07HYD303"),
      category: "increasing_traffic",
      metricLabel: "12% increase in page views",
      deltaAmount: 456.3,
    },
    {
      asin: "B09ABC5678",
      title: "Sanabul Jump Rope Speed Cable",
      imageUrl: getProductImageUrl("B09ABC5678"),
      category: "declining_traffic",
      metricLabel: "8% decline in page views",
      deltaAmount: -298.15,
    },
  ],
  ads: { spend: 428500, roas: 4.8, acos: 12.4 },
  conversion: { rate: 15.8, sessions: 1240000 },
};

export const amazonApexBundle = buildAmazonBundle(amazonApexDataConfig);
