import type { EChartsOption, LineSeriesOption } from "echarts";

export const WALMART_PURPLE = "#a78bc5";
export const WALMART_PURPLE_LEGACY = "#7659b6";
export const WALMART_CHART_FILL = "rgba(167, 139, 197, 0.18)";
const GRID_COLOR = "#e5e7eb";
const MUTED = "#6b7280";

export type ChartVariant = "walmart-area";

export function buildSeriesConfig(
  _variant: ChartVariant,
  name: string
): LineSeriesOption[] {
  return [
    {
      name,
      type: "line",
      smooth: 0.45,
      symbol: "none",
      lineStyle: { width: 1.5, color: WALMART_PURPLE },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: WALMART_CHART_FILL },
            { offset: 1, color: "rgba(167, 139, 197, 0.02)" },
          ],
        },
      },
      emphasis: {
        focus: "series",
        lineStyle: { width: 2.5 },
      },
    },
  ];
}

export function baseGridOption(options?: {
  compactBottom?: boolean;
}): Pick<
  EChartsOption,
  "grid" | "xAxis" | "yAxis" | "tooltip" | "axisPointer"
> {
  return {
    grid: {
      left: 56,
      right: 16,
      top: 24,
      bottom: options?.compactBottom ? 32 : 72,
      containLabel: false,
    },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: GRID_COLOR } },
      axisTick: { show: false },
      axisLabel: {
        color: MUTED,
        fontSize: 10,
        hideOverlap: true,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: MUTED,
        fontSize: 10,
      },
      splitLine: {
        lineStyle: { color: GRID_COLOR, type: "dashed", opacity: 0.35 },
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        crossStyle: { color: GRID_COLOR },
        lineStyle: { color: WALMART_PURPLE, type: "dashed" },
      },
      backgroundColor: "#ffffff",
      borderColor: GRID_COLOR,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#111111", fontSize: 12 },
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 4px;",
    },
    axisPointer: {
      link: [{ xAxisIndex: "all" }],
    },
  };
}
