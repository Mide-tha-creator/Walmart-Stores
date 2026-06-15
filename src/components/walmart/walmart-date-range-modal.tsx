"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfWeek, startOfMonth, subDays } from "date-fns";
import { Globe } from "lucide-react";
import { DayPicker } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/types/common";

import "react-day-picker/style.css";

interface DatePreset {
  id: string;
  label: string;
  sublabel: string;
  range: DateRange;
}

function buildPresets(today: Date = new Date()): DatePreset[] {
  const weekEnd = subDays(today, 1);
  const weekStart = startOfWeek(weekEnd, { weekStartsOn: 0 });
  const monthStart = startOfMonth(today);
  const monthEnd = subDays(today, 1);

  return [
    {
      id: "today",
      label: "Today",
      sublabel: format(today, "MMM d, yyyy"),
      range: { start: format(today, "yyyy-MM-dd"), end: format(today, "yyyy-MM-dd") },
    },
    {
      id: "this-week",
      label: "This Week",
      sublabel: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
      range: {
        start: format(weekStart, "yyyy-MM-dd"),
        end: format(weekEnd, "yyyy-MM-dd"),
      },
    },
    {
      id: "this-month",
      label: "This Month",
      sublabel: `${format(monthStart, "MMM d")} - ${format(monthEnd, "MMM d, yyyy")}`,
      range: {
        start: format(monthStart, "yyyy-MM-dd"),
        end: format(monthEnd, "yyyy-MM-dd"),
      },
    },
    {
      id: "q1",
      label: "Q1",
      sublabel: "Feb 1 - Apr 30, 2026",
      range: { start: "2026-02-01", end: "2026-04-30" },
    },
    {
      id: "q2",
      label: "Q2",
      sublabel: "May 1 - Jul 31, 2026",
      range: { start: "2026-05-01", end: "2026-07-31" },
    },
    {
      id: "q3",
      label: "Q3",
      sublabel: "Aug 1 - Oct 31, 2026",
      range: { start: "2026-08-01", end: "2026-10-31" },
    },
    {
      id: "custom",
      label: "Custom",
      sublabel: "Select dates on calendar",
      range: { start: "2024-01-01", end: format(today, "yyyy-MM-dd") },
    },
  ];
}

function toDisplay(iso: string): string {
  return format(parseISO(iso), "MM/dd/yyyy");
}

function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

interface WalmartDateRangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliedRange: DateRange;
  onApply: (range: DateRange) => void;
  triggerLabel: string;
}

export function WalmartDateRangeModal({
  open,
  onOpenChange,
  appliedRange,
  onApply,
  triggerLabel,
}: WalmartDateRangeModalProps) {
  const presets = useMemo(() => buildPresets(), []);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>(appliedRange);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("custom");
  const [month, setMonth] = useState<Date>(parseISO(appliedRange.start));

  useEffect(() => {
    if (!open) return;
    setDraftRange(appliedRange);
    setMonth(parseISO(appliedRange.start));
    const match = presets.find(
      (p) =>
        p.range.start === appliedRange.start && p.range.end === appliedRange.end
    );
    setSelectedPresetId(match?.id ?? "custom");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on start/end only to avoid object identity loops
  }, [open, appliedRange.start, appliedRange.end]);

  const startDate = parseISO(draftRange.start);
  const endDate = parseISO(draftRange.end);

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPresetId(preset.id);
    setDraftRange(preset.range);
    setMonth(parseISO(preset.range.start));
  };

  const handleApply = () => {
    onApply(draftRange);
    onOpenChange(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="flex h-[34px] items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 text-[12px] text-[#111827] hover:bg-[#f9fafb]"
      >
        <svg
          className="h-3.5 w-3.5 text-[#6b7280]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {triggerLabel}
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[820px] gap-0 overflow-hidden p-0 sm:max-w-[820px] [&>button]:hidden">
          <DialogTitle className="sr-only">Select date range</DialogTitle>
          <div className="flex min-h-[420px]">
            <aside className="w-[240px] shrink-0 border-r border-[#e5e7eb] bg-white p-4">
              <div className="mb-4 flex items-start gap-2">
                <Switch
                  id="compare"
                  checked={compareEnabled}
                  onCheckedChange={setCompareEnabled}
                />
                <div>
                  <Label htmlFor="compare" className="text-[13px] font-semibold text-[#111111]">
                    Compare
                  </Label>
                  <p className="text-[11px] text-[#6b7280]">
                    Compare performance data across date ranges.
                  </p>
                </div>
              </div>
              <ul className="space-y-0.5">
                {presets.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        "relative w-full rounded px-3 py-2 text-left transition-colors",
                        selectedPresetId === preset.id
                          ? "bg-[#f0f7ff] text-[#0071ce]"
                          : "text-[#111111] hover:bg-[#f9fafb]"
                      )}
                    >
                      {selectedPresetId === preset.id && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-[#0071ce]"
                          aria-hidden
                        />
                      )}
                      <span className="block text-[13px] font-medium">{preset.label}</span>
                      <span className="block text-[11px] text-[#6b7280]">
                        {preset.sublabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="p-5 pb-3">
                <div className="mb-4 flex gap-4">
                  <div className="flex-1">
                    <Label className="mb-1 block text-[12px] text-[#6b7280]">
                      Start date
                    </Label>
                    <Input
                      readOnly
                      value={toDisplay(draftRange.start)}
                      className="h-9 border-[#e5e7eb] bg-white text-[13px]"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="mb-1 block text-[12px] text-[#6b7280]">
                      End date
                    </Label>
                    <Input
                      readOnly
                      value={toDisplay(draftRange.end)}
                      className="h-9 border-[#e5e7eb] bg-white text-[13px]"
                    />
                  </div>
                </div>
                <DayPicker
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    if (range?.from) {
                      const start = toIso(range.from);
                      const end = range.to ? toIso(range.to) : start;
                      setDraftRange({ start, end });
                      setSelectedPresetId("custom");
                    }
                  }}
                  month={month}
                  onMonthChange={setMonth}
                  numberOfMonths={2}
                  defaultMonth={startDate}
                  classNames={{
                    root: "walmart-day-picker mx-auto",
                    months: "flex gap-6",
                    month_caption: "flex justify-center pb-2 text-[13px] font-semibold text-[#111111]",
                    nav: "flex items-center justify-between absolute inset-x-0 top-0",
                    button_previous: "h-7 w-7 text-[#0071ce] hover:bg-[#f0f7ff] rounded",
                    button_next: "h-7 w-7 text-[#0071ce] hover:bg-[#f0f7ff] rounded",
                    weekday: "w-9 text-center text-[11px] text-[#6b7280]",
                    day: "h-9 w-9 p-0 text-center text-[13px]",
                    day_button: "h-9 w-9 font-normal hover:bg-[#e8f1fb] rounded-full",
                    selected:
                      "[&>button]:bg-[#0071ce] [&>button]:text-white [&>button]:hover:bg-[#0071ce]",
                    range_start: "[&>button]:bg-[#0071ce] [&>button]:text-white",
                    range_end: "[&>button]:bg-[#0071ce] [&>button]:text-white",
                    range_middle: "[&>button]:bg-[#e8f1fb] [&>button]:text-[#111111]",
                    today: "[&>button]:font-bold",
                  }}
                />
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-[#e5e7eb] px-5 py-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                  <Globe className="h-3.5 w-3.5" />
                  Pacific Standard Time (PST) - {format(new Date(), "MM/dd/yyyy hh:mm a")}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="text-[13px] font-medium text-[#0071ce] hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded bg-[#0071ce] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#004f9a]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
