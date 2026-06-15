"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { GlobalFilterBar } from "@/components/dashboard/global-filter-bar";
import { SalesSnapshotSection } from "@/components/dashboard/sales-snapshot-section";
import { CompareSalesSection } from "@/components/dashboard/compare-sales-section";
import { BusinessInsightsPanel } from "@/components/dashboard/business-insights-panel";
import { AsinPerformanceSection } from "@/components/dashboard/asin-performance-section";
import { PageHeader } from "@/components/layouts/page-header";
import { ReportPageLayout } from "@/components/layouts/report-page-layout";
import { useReportFilters } from "@/hooks/use-report-filters";
import { getSalesDashboard } from "@/services/amazon-sales.service";
import type { SalesDashboardResponse } from "@/types/amazon";
import { subDays, format } from "date-fns";
import type { DatePreset } from "@/types/common";

interface AmazonReportContentProps {
  title: string;
  showAsinCarousel?: boolean;
}

function applyPreset(preset: DatePreset): { start: string; end: string } {
  const end = new Date();
  const endStr = format(end, "yyyy-MM-dd");
  switch (preset) {
    case "7d":
      return { start: format(subDays(end, 7), "yyyy-MM-dd"), end: endStr };
    case "30d":
      return { start: format(subDays(end, 30), "yyyy-MM-dd"), end: endStr };
    case "90d":
      return { start: format(subDays(end, 90), "yyyy-MM-dd"), end: endStr };
    case "ytd":
      return { start: format(new Date(end.getFullYear(), 0, 1), "yyyy-MM-dd"), end: endStr };
    default:
      return { start: format(subDays(end, 30), "yyyy-MM-dd"), end: endStr };
  }
}

export function AmazonReportContent({
  title,
  showAsinCarousel = false,
}: AmazonReportContentProps) {
  const {
    draft,
    applied,
    updateRange,
    updatePreset,
    updateFulfillment,
    updateSalesBreakdown,
    applyFilters,
  } = useReportFilters();

  const [data, setData] = useState<SalesDashboardResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (filters = applied) => {
      startTransition(async () => {
        const result = await getSalesDashboard(filters);
        setData(result);
      });
    },
    [applied]
  );

  useEffect(() => {
    fetchData(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    const next = applyFilters();
    fetchData(next);
  };

  const handlePresetChange = (preset: DatePreset) => {
    updatePreset(preset);
    if (preset !== "custom") {
      updateRange(applyPreset(preset));
    }
  };

  const isLoading = isPending || !data;

  return (
    <ReportPageLayout>
      <PageHeader title={title} onRefresh={() => fetchData(applied)} />
      {showAsinCarousel && data && (
        <AsinPerformanceSection alerts={data.asinAlerts} />
      )}
      <GlobalFilterBar
        filters={draft}
        onPresetChange={handlePresetChange}
        onRangeChange={updateRange}
        onFulfillmentChange={updateFulfillment}
        onSalesBreakdownChange={updateSalesBreakdown}
        onApply={handleApply}
        isPending={isPending}
      />
      <SalesSnapshotSection snapshot={data?.snapshot} isLoading={isLoading} />
      <CompareSalesSection
        timeSeries={data?.timeSeries}
        aggregate={data?.aggregate}
        isLoading={isLoading}
      />
      <BusinessInsightsPanel insights={data?.insights} isLoading={isLoading} />
    </ReportPageLayout>
  );
}
