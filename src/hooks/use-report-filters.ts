"use client";

import { useCallback, useState } from "react";
import { getRollingDashboardDateRange } from "@/lib/store/rolling-dashboard-range";
import type { DatePreset, ReportFilters } from "@/types/common";

function createDefaultFilters(
  initial?: Partial<ReportFilters>
): ReportFilters {
  const hasCustomRange = Boolean(initial?.range);
  return {
    preset: hasCustomRange ? "custom" : "30d",
    range: initial?.range ?? getRollingDashboardDateRange(),
    ...initial,
  };
}

export function useReportFilters(initial?: Partial<ReportFilters>) {
  const [draft, setDraft] = useState<ReportFilters>(() =>
    createDefaultFilters(initial)
  );
  const [applied, setApplied] = useState<ReportFilters>(() =>
    createDefaultFilters(initial)
  );

  const updateDraft = useCallback((patch: Partial<ReportFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateRange = useCallback((range: ReportFilters["range"]) => {
    setDraft((prev) => ({ ...prev, range, preset: "custom" }));
  }, []);

  const updatePreset = useCallback((preset: DatePreset) => {
    setDraft((prev) => ({ ...prev, preset }));
  }, []);

  const applyFilters = useCallback(() => {
    setApplied({ ...draft });
    return draft;
  }, [draft]);

  return {
    draft,
    applied,
    updateDraft,
    updateRange,
    updatePreset,
    applyFilters,
    setApplied,
  };
}
