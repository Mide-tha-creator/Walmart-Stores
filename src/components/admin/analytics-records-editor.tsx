"use client";

import { useMemo } from "react";
import { addDays, format, parseISO } from "date-fns";
import { Copy, Plus, Sparkles, Trash2, TrendingUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeTableRowDate } from "@/lib/store/walmart-table-rows";
import type { RecentAnalyticsRecord, RecentAnalyticsWindow } from "@/types/recent-analytics";

interface AnalyticsRecordsEditorProps {
  records: RecentAnalyticsRecord[];
  analyticsWindow: RecentAnalyticsWindow;
  dirty: boolean;
  onChange: (records: RecentAnalyticsRecord[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onRestoreDefaults: () => void;
  storeId: string;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function scanForwardForFreeDate(
  start: string,
  used: Set<string>,
  analyticsWindow: RecentAnalyticsWindow
): string | null {
  let cursor = start;
  for (let i = 0; i < 5000; i++) {
    if (cursor >= analyticsWindow.start && !used.has(cursor)) {
      return cursor;
    }
    cursor = format(addDays(parseISO(cursor), 1), "yyyy-MM-dd");
  }
  return null;
}

function findNextEditableDate(
  records: RecentAnalyticsRecord[],
  analyticsWindow: RecentAnalyticsWindow
): string {
  const used = new Set(records.map((r) => normalizeTableRowDate(r.date)));
  const anchor = analyticsWindow.anchorEnd;

  const afterAnchor = format(addDays(parseISO(anchor), 1), "yyyy-MM-dd");
  const fromFuture = scanForwardForFreeDate(afterAnchor, used, analyticsWindow);
  if (fromFuture) return fromFuture;

  const newest = records.reduce((max, r) => {
    const d = normalizeTableRowDate(r.date);
    return d > max ? d : max;
  }, "");
  if (newest) {
    const afterNewest = format(addDays(parseISO(newest), 1), "yyyy-MM-dd");
    const fromNewest = scanForwardForFreeDate(afterNewest, used, analyticsWindow);
    if (fromNewest) return fromNewest;
  }

  let backward = anchor;
  for (let i = 0; i < 500; i++) {
    if (backward < analyticsWindow.start) break;
    if (!used.has(backward)) return backward;
    backward = format(addDays(parseISO(backward), -1), "yyyy-MM-dd");
  }

  return anchor;
}

export function AnalyticsRecordsEditor({
  records,
  analyticsWindow,
  dirty,
  onChange,
  onSave,
  onCancel,
  onRestoreDefaults,
  storeId,
}: AnalyticsRecordsEditorProps) {
  const windowLabel = useMemo(
    () =>
      `${analyticsWindow.start} onward (generated data through ${analyticsWindow.anchorEnd}, no end limit)`,
    [analyticsWindow.start, analyticsWindow.anchorEnd]
  );

  const updateRow = (index: number, patch: Partial<RecentAnalyticsRecord>) => {
    const next = [...records];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const deleteRow = (index: number) => {
    const row = records[index];
    if (
      (row.totalSales > 0 || row.unitsSold > 0) &&
      !window.confirm(`Remove row for ${row.date}?`)
    ) {
      return;
    }
    onChange(records.filter((_, i) => i !== index));
  };

  const addNewRow = () => {
    const nextDate = findNextEditableDate(records, analyticsWindow);
    onChange([
      {
        date: nextDate,
        totalSales: 0,
        unitsSold: 0,
      },
      ...records,
    ]);
  };

  const duplicateRow = (index: number) => {
    const source = records[index];
    let date = normalizeTableRowDate(source.date);
    const used = new Set(records.map((r) => normalizeTableRowDate(r.date)));
    for (let i = 0; i < 5000; i++) {
      const next = format(addDays(parseISO(date), 1), "yyyy-MM-dd");
      if (!used.has(next)) {
        date = next;
        break;
      }
      date = next;
    }
    const copy: RecentAnalyticsRecord = {
      ...source,
      date,
    };
    const next = [...records];
    next.splice(index, 0, copy);
    onChange(next.sort((a, b) => b.date.localeCompare(a.date)));
  };

  const bulkAddRows = () => {
    const count = Number(window.prompt("How many empty rows to add?", "5"));
    if (!Number.isFinite(count) || count < 1 || count > 30) return;
    const added: RecentAnalyticsRecord[] = [];
    const used = new Set(records.map((r) => normalizeTableRowDate(r.date)));
    let cursor = findNextEditableDate(records, analyticsWindow);
    for (let i = 0; i < count; i++) {
      while (used.has(cursor)) {
        cursor = format(addDays(parseISO(cursor), 1), "yyyy-MM-dd");
      }
      used.add(cursor);
      added.push({ date: cursor, totalSales: 0, unitsSold: 0 });
      cursor = format(addDays(parseISO(cursor), 1), "yyyy-MM-dd");
    }
    onChange([...added, ...records].sort((a, b) => b.date.localeCompare(a.date)));
  };

  const regenerateFluctuations = () => {
    const seed = hashSeed(storeId);
    const next = records.map((r, i) => {
      const noise = 1 + (((seed + i * 17) % 100) / 1000) * (Math.sin(i) > 0 ? 1 : -1) * 0.08;
      return {
        ...r,
        totalSales: Math.round(r.totalSales * noise * 100) / 100,
        unitsSold: Math.max(0, Math.round(r.unitsSold * noise)),
      };
    });
    onChange(next);
  };

  const quickSpike = () => {
    if (records.length === 0) return;
    const idx = 0;
    const next = records.map((r, i) => {
      const factor = i === idx ? 1.55 : i === idx + 1 ? 1.18 : i === idx - 1 ? 1.12 : 1;
      if (i > idx + 1 || i < idx - 1) return r;
      return {
        ...r,
        totalSales: Math.round(r.totalSales * factor * 100) / 100,
        unitsSold: Math.max(0, Math.round(r.unitsSold * factor)),
      };
    });
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#111111]">Recent analytics</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Editable window: <span className="font-medium text-[#374151]">{windowLabel}</span>.
            History before the window start is locked. You can add or edit rows on any date
            from the window start onward, including unlimited future dates. Saves smooth sharp
            jumps and update charts when the dashboard date range includes those days. KPI
            cards keep baseline totals; new or changed rows add on top.
          </p>
          {dirty ? (
            <p className="mt-1 text-xs font-medium text-amber-700">Unsaved changes</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addNewRow}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add new
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onSave}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={!dirty}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#e5e7eb] pb-3">
        <Button type="button" variant="outline" size="sm" onClick={() => duplicateRow(0)}>
          <Copy className="mr-1 h-3.5 w-3.5" />
          Duplicate newest
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={bulkAddRows}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Bulk add
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={regenerateFluctuations}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Regenerate fluctuations
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={quickSpike}>
          <TrendingUp className="mr-1 h-3.5 w-3.5" />
          Quick spike
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onRestoreDefaults}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Restore default recent
        </Button>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-md border border-[#e5e7eb]">
        <table className="w-full min-w-[640px] border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-[#f9fafb]">
            <tr className="border-b border-[#e5e7eb]">
              {["Date", "Total sales", "Units sold", ""].map((heading) => (
                <th
                  key={heading || "actions"}
                  className="px-2 py-2 text-left font-semibold text-[#374151]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[#6b7280]">
                  No rows in the editable window. Click Add new to create one.
                </td>
              </tr>
            ) : (
              records.map((row, index) => (
                <tr
                  key={`${row.date}-${index}`}
                  className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]"
                >
                  <td className="px-2 py-1.5">
                    <Input
                      type="date"
                      className="h-8 w-[148px] text-[12px]"
                      min={analyticsWindow.start}
                      value={normalizeTableRowDate(row.date)}
                      onChange={(e) => updateRow(index, { date: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 w-[120px] text-[12px]"
                      value={row.totalSales}
                      onChange={(e) =>
                        updateRow(index, {
                          totalSales: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      className="h-8 w-[100px] text-[12px]"
                      value={row.unitsSold}
                      onChange={(e) =>
                        updateRow(index, {
                          unitsSold: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Duplicate row"
                        onClick={() => duplicateRow(index)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="Delete row"
                        onClick={() => deleteRow(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {records.length} row{records.length === 1 ? "" : "s"} in window. Future fields
        (orders, sessions, conversion rate) can be added to the schema without changing
        storage keys.
      </p>
    </div>
  );
}
