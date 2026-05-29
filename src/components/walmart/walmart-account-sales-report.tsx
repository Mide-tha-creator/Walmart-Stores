"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { MetricCardRow } from "@/components/dashboard/metric-card-row";
import { SalesDataTable } from "@/components/tables/sales-data-table";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { WalmartDateRangeModal } from "@/components/walmart/walmart-date-range-modal";
import { WalmartSalesChart } from "@/components/walmart/walmart-sales-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLongDateRange } from "@/lib/format-date";
import { useStoreOverridesVersion } from "@/hooks/use-store-overrides-version";
import { getMetricLabel, getWalmartInsights } from "@/services/store-analytics.service";
import type { StoreId } from "@/config/stores/types";
import type { WalmartMetricKey, WalmartSalesInsightsResponse } from "@/types/walmart";
import type { DateRange, ReportFilters } from "@/types/common";

interface WalmartAccountSalesReportProps {
  storeId: string;
  defaultDateRange: DateRange;
}

export function WalmartAccountSalesReport({
  storeId,
  defaultDateRange,
}: WalmartAccountSalesReportProps) {
  const [activeMetric, setActiveMetric] = useState<WalmartMetricKey>("gmv");
  const [data, setData] = useState<WalmartSalesInsightsResponse | null>(null);
  const [appliedRange, setAppliedRange] = useState<DateRange>(defaultDateRange);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const overridesVersion = useStoreOverridesVersion(storeId as StoreId);

  const fetchData = useCallback(
    (range: DateRange) => {
      startTransition(async () => {
        const filters: ReportFilters = {
          preset: "custom",
          range,
          fulfillment: "both",
          salesBreakdown: "marketplace_total",
        };
        const result = await getWalmartInsights(storeId, filters);
        setData(result);
      });
    },
    [storeId]
  );

  useEffect(() => {
    fetchData(appliedRange);
  }, [fetchData, appliedRange, overridesVersion]);

  const fullChartData = data?.timeSeries[activeMetric] ?? [];
  const dateLabel = formatLongDateRange(appliedRange.start, appliedRange.end);

  const yAxisFormat =
    activeMetric === "gmv" || activeMetric === "aur" ? "currency" : "compact";

  return (
    <div className="space-y-6">
      <div className="rounded-[6px] border border-[#e5e7eb] bg-white px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[14px] font-semibold text-[#111827]">
            Account sales summary
          </h2>
          <WalmartDateRangeModal
            open={dateModalOpen}
            onOpenChange={setDateModalOpen}
            appliedRange={appliedRange}
            onApply={(range) => setAppliedRange(range)}
            triggerLabel={dateLabel}
          />
        </div>

        {isPending || !data ? (
          <Skeleton className="mb-3 h-20 w-full" />
        ) : (
          <MetricCardRow
            summary={data.summary}
            activeMetric={activeMetric}
            onSelect={setActiveMetric}
            variant="walmart"
          />
        )}

        <div className="mt-4 mb-6">
          {isPending || !data ? (
            <Skeleton className="h-[380px] w-full" />
          ) : (
            <WalmartSalesChart
              data={fullChartData}
              seriesName={getMetricLabel(activeMetric)}
              yAxisFormat={yAxisFormat}
              metricKey={activeMetric}
            />
          )}
        </div>
      </div>

      <div className="rounded-[6px] border border-[#e5e7eb] bg-white px-4 py-3">
        <TableToolbar variant="walmart" />
        {isPending || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <SalesDataTable rows={data.tableRows} variant="walmart" />
        )}
      </div>
    </div>
  );
}
