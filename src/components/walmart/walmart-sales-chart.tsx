"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Minus } from "lucide-react";
import * as echarts from "echarts";
import { Skeleton } from "@/components/ui/skeleton";
import { computeWalmartGmvYDomain } from "@/lib/charts/walmart-chart-domain";
import type { ChartPoint } from "@/lib/charts/downsample-series";
import {
  formatAxisTick,
  getVisibleSpanDays,
  resolveAxisGranularity,
} from "@/lib/charts/time-axis-format";

const EnterpriseTimeSeriesChart = dynamic(
  () =>
    import("@/components/charts/enterprise-time-series-chart").then(
      (m) => m.EnterpriseTimeSeriesChart
    ),
  { ssr: false, loading: () => <Skeleton className="h-[380px] w-full" /> }
);

interface WalmartSalesChartProps {
  data: ChartPoint[];
  seriesName: string;
  yAxisFormat: "currency" | "number" | "compact";
  metricKey: "gmv" | "unitsSold" | "orders" | "aur";
}

function isZoomed(
  chart: echarts.ECharts,
  fullMin: number,
  fullMax: number
): boolean {
  const opt = chart.getOption() as {
    dataZoom?: Array<{ start?: number; end?: number; startValue?: number; endValue?: number }>;
  };
  const dz = opt.dataZoom?.[0];
  if (dz?.start != null && dz?.end != null) {
    return dz.start > 0.5 || dz.end < 99.5;
  }
  if (typeof dz?.startValue === "number" && typeof dz?.endValue === "number") {
    const span = fullMax - fullMin;
    if (span <= 0) return false;
    const margin = span * 0.01;
    return (
      dz.startValue > fullMin + margin || dz.endValue < fullMax - margin
    );
  }
  return false;
}

export function WalmartSalesChart({
  data,
  seriesName,
  yAxisFormat,
  metricKey,
}: WalmartSalesChartProps) {
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [showReset, setShowReset] = useState(false);

  const yDomain =
    metricKey === "gmv" ? computeWalmartGmvYDomain(data) : ("auto" as const);

  const handleChartReady = useCallback((instance: echarts.ECharts) => {
    chartRef.current = instance;
  }, []);

  const fullExtent = useMemo(() => {
    if (!data.length) return { min: 0, max: 0 };
    return {
      min: new Date(data[0].date).getTime(),
      max: new Date(data[data.length - 1].date).getTime(),
    };
  }, [data]);

  const handleVisibleRangeChange = useCallback(
    () => {
      const chart = chartRef.current;
      if (!chart) {
        setShowReset(false);
        return;
      }
      setShowReset(isZoomed(chart, fullExtent.min, fullExtent.max));
    },
    [fullExtent]
  );

  const handleResetZoom = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
    const { min, max } = fullExtent;
    const spanDays = getVisibleSpanDays(min, max);
    const granularity = resolveAxisGranularity(spanDays);
    chart.setOption({
      xAxis: {
        axisLabel: {
          formatter: (value: number) => formatAxisTick(value, granularity),
        },
      },
    });
    setShowReset(false);
  }, [fullExtent]);

  return (
    <div className="relative">
      <EnterpriseTimeSeriesChart
        data={data}
        variant="walmart-area"
        seriesName={seriesName}
        height={380}
        yAxisFormat={yAxisFormat}
        yDomain={yDomain}
        showSlider={false}
        showToolbox={false}
        onChartReady={handleChartReady}
        onVisibleRangeChange={handleVisibleRangeChange}
      />
      {showReset && (
        <button
          type="button"
          onClick={handleResetZoom}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#0071ce] text-white hover:bg-[#004f9a]"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
