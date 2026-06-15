"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { formatCurrency } from "@/lib/format-currency";
import { formatDisplayDate } from "@/lib/format-date";
import { prepareChartPoints, type ChartPoint } from "@/lib/charts/downsample-series";
import {
  baseGridOption,
  buildSeriesConfig,
  type ChartVariant,
  WALMART_PURPLE,
} from "@/lib/charts/chart-themes";
import {
  formatAxisTick,
  getVisibleSpanDays,
  isoFromMs,
  resolveAxisGranularity,
} from "@/lib/charts/time-axis-format";

export interface VisibleRange {
  start: string;
  end: string;
}

export interface EnterpriseTimeSeriesChartProps {
  data: ChartPoint[];
  variant: ChartVariant;
  seriesName?: string;
  height?: number;
  yAxisFormat?: "currency" | "number" | "compact";
  yDomain?: [number, number] | "auto";
  ySplitNumber?: number;
  groupId?: string;
  onVisibleRangeChange?: (range: VisibleRange | null) => void;
  showSlider?: boolean;
  showToolbox?: boolean;
  onChartReady?: (instance: echarts.ECharts) => void;
}

function toSeriesData(points: ChartPoint[]): [number, number][] {
  return points.map((p) => [new Date(p.date).getTime(), p.value]);
}

function formatYValue(
  value: number,
  format: "currency" | "number" | "compact"
): string {
  if (format === "currency") return formatCurrency(value);
  if (format === "compact") {
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    return String(Math.round(value));
  }
  return value.toLocaleString();
}

export function EnterpriseTimeSeriesChart({
  data,
  variant,
  seriesName = "Value",
  height = 340,
  yAxisFormat = "currency",
  yDomain = "auto",
  ySplitNumber,
  groupId,
  onVisibleRangeChange,
  showSlider = true,
  showToolbox = true,
  onChartReady,
}: EnterpriseTimeSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const granularityRef = useRef(resolveAxisGranularity(365));

  const prepared = useMemo(() => prepareChartPoints(data, 1500), [data]);
  const seriesData = useMemo(() => toSeriesData(prepared), [prepared]);

  const fullMin = useMemo(
    () => (prepared.length ? new Date(prepared[0].date).getTime() : Date.now()),
    [prepared]
  );
  const fullMax = useMemo(
    () =>
      prepared.length
        ? new Date(prepared[prepared.length - 1].date).getTime()
        : Date.now(),
    [prepared]
  );

  const updateAxisGranularity = useCallback((startMs: number, endMs: number) => {
    const spanDays = getVisibleSpanDays(startMs, endMs);
    granularityRef.current = resolveAxisGranularity(spanDays);
    chartRef.current?.setOption({
      xAxis: {
        axisLabel: {
          formatter: (value: number) =>
            formatAxisTick(value, granularityRef.current),
        },
      },
    });
  }, []);

  const handleDataZoom = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const opt = chart.getOption() as {
      dataZoom?: Array<{ startValue?: number; endValue?: number }>;
    };
    const dz = opt.dataZoom?.[0];
    const startMs =
      typeof dz?.startValue === "number" ? dz.startValue : fullMin;
    const endMs = typeof dz?.endValue === "number" ? dz.endValue : fullMax;
    updateAxisGranularity(startMs, endMs);
    onVisibleRangeChange?.({
      start: isoFromMs(startMs),
      end: isoFromMs(endMs),
    });
  }, [fullMin, fullMax, onVisibleRangeChange, updateAxisGranularity]);

  const buildOption = useCallback((): EChartsOption => {
    const accent = WALMART_PURPLE;
    const yAxis =
      yDomain !== "auto"
        ? {
            min: yDomain[0],
            max: yDomain[1],
            ...(ySplitNumber != null ? { splitNumber: ySplitNumber } : {}),
          }
        : { scale: true };

    const dataZoomComponents: EChartsOption["dataZoom"] = [
      {
        type: "inside",
        xAxisIndex: 0,
        filterMode: "none",
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false,
      },
    ];

    if (showSlider) {
      dataZoomComponents.push({
        type: "slider",
        xAxisIndex: 0,
        height: 22,
        bottom: 8,
        filterMode: "none",
        borderColor: "#e5e7eb",
        fillerColor: "rgba(118, 89, 182, 0.12)",
        handleStyle: { color: accent, borderColor: accent },
        dataBackground: {
          lineStyle: { color: accent, opacity: 0.35 },
          areaStyle: { color: "rgba(118, 89, 182, 0.08)" },
        },
        selectedDataBackground: {
          lineStyle: { color: accent },
          areaStyle: { color: "rgba(118, 89, 182, 0.15)" },
        },
      });
    }

    const option: EChartsOption = {
      ...baseGridOption({ compactBottom: !showSlider }),
      animation: false,
      toolbox: showToolbox
        ? {
            right: 8,
            top: 0,
            feature: {
              dataZoom: {
                yAxisIndex: false,
                title: { zoom: "Zoom", back: "Reset" },
              },
              restore: { title: "Restore" },
            },
            iconStyle: { borderColor: "#6b7280" },
          }
        : undefined,
      dataZoom: dataZoomComponents,
      xAxis: {
        type: "time",
        min: fullMin,
        max: fullMax,
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: "#6b7280",
          fontSize: 10,
          hideOverlap: true,
          formatter: (value: number) =>
            formatAxisTick(value, granularityRef.current),
        },
      },
      yAxis: {
        type: "value",
        ...yAxis,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: "#e5e7eb", type: "dashed", opacity: 0.6 },
        },
        axisLabel: {
          color: "#6b7280",
          fontSize: 10,
          formatter: (v: number) => formatYValue(v, yAxisFormat),
        },
      },
      tooltip: {
        ...baseGridOption().tooltip,
        axisPointer: {
          type: "cross",
          crossStyle: { color: "#d5d9d9" },
          lineStyle: { color: accent, type: "dashed" },
        },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params];
          const first = items[0] as {
            axisValue?: number;
            data?: [number, number];
            seriesName?: string;
          };
          const ms = first?.data?.[0] ?? first?.axisValue;
          const val = first?.data?.[1];
          if (ms == null || val == null) return "";
          return `<div style="font-weight:600;margin-bottom:4px">${formatDisplayDate(isoFromMs(ms))}</div>
            <div>${first.seriesName ?? seriesName}: <strong>${formatYValue(val, yAxisFormat)}</strong></div>`;
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: "all" }],
        lineStyle: { color: accent, type: "dashed" },
      },
      series: buildSeriesConfig(variant, seriesName).map((s) => ({
        ...s,
        data: seriesData,
      })),
    };

    return option;
  }, [
    variant,
    seriesName,
    yDomain,
    ySplitNumber,
    yAxisFormat,
    showSlider,
    showToolbox,
    fullMin,
    fullMax,
    seriesData,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    if (groupId) {
      (chart as echarts.ECharts & { group?: string }).group = groupId;
    }

    chart.setOption(buildOption(), { notMerge: true });
    updateAxisGranularity(fullMin, fullMax);
    onChartReady?.(chart);

    chart.on("dataZoom", handleDataZoom);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      chart.off("dataZoom", handleDataZoom);
      chart.dispose();
      chartRef.current = null;
    };
  }, [
    buildOption,
    fullMin,
    fullMax,
    groupId,
    handleDataZoom,
    onChartReady,
    updateAxisGranularity,
    variant,
    showToolbox,
  ]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(buildOption(), { notMerge: false, lazyUpdate: true });
    updateAxisGranularity(fullMin, fullMax);
  }, [buildOption, fullMin, fullMax, updateAxisGranularity]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height }}
      role="img"
      aria-label={`${seriesName} time series chart`}
    />
  );
}
