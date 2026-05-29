"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ALL_STORES, getStoreConfig } from "@/config/stores/registry";
import type { StoreId } from "@/config/stores/types";
import { AnalyticsRecordsEditor } from "@/components/admin/analytics-records-editor";
import {
  clearStoreOverrides,
  getAllOverridesForAdmin,
  loadStoreOverrides,
  saveStoreOverrides,
} from "@/lib/store/resolve-store-data";
import { interpolateRecentEdits } from "@/lib/store/interpolate-recent-edits";
import {
  buildOverridesFromRecentRecords,
  loadRecentAnalyticsRecordsForStore,
} from "@/lib/store/recent-analytics-merge";
import {
  getRecentAnalyticsWindow,
  getStoreAnalyticsAnchorEnd,
} from "@/lib/store/recent-analytics-window";
import { validateRecentAnalyticsRecords } from "@/lib/store/recent-analytics-save";
import { notifyStoreOverridesUpdated } from "@/lib/store/use-display-store-config";
import { getAmazonBundle, getWalmartBundle } from "@/data/stores/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { StoreOverrides } from "@/types/store-data";
import type { RecentAnalyticsRecord } from "@/types/recent-analytics";

const EMPTY_KPI_FORM = {
  totalOrderItems: "",
  unitsOrdered: "",
  orderedProductSales: "",
  avgUnitsPerOrderItem: "",
  avgSalesPerOrderItem: "",
  generatedAt: "",
  gmv: "",
  unitsSold: "",
  orders: "",
  aur: "",
};

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  if (!value.trim()) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export default function AdminPage() {
  const [storeId, setStoreId] = useState<StoreId>("amazon-chokebody");
  const [overridesJson, setOverridesJson] = useState("{}");
  const [displayName, setDisplayName] = useState("");
  const [kpiForm, setKpiForm] = useState(EMPTY_KPI_FORM);
  const [recentRecords, setRecentRecords] = useState<RecentAnalyticsRecord[]>([]);
  const [savedRecordsJson, setSavedRecordsJson] = useState("[]");

  const config = getStoreConfig(storeId);
  const isAmazon = config.template === "amazon-sales";

  const analyticsWindow = useMemo(() => {
    const anchorEnd =
      config.marketplace === "amazon"
        ? getStoreAnalyticsAnchorEnd("amazon", getAmazonBundle(storeId).config)
        : getStoreAnalyticsAnchorEnd("walmart", getWalmartBundle(storeId).config);
    return getRecentAnalyticsWindow(anchorEnd);
  }, [storeId, config.marketplace]);

  const recentDirty =
    JSON.stringify(recentRecords) !== savedRecordsJson;

  const loadEditorState = useCallback((id: StoreId) => {
    const overrides = getAllOverridesForAdmin(id);
    const baseConfig = getStoreConfig(id);
    setOverridesJson(JSON.stringify(overrides, null, 2));
    setDisplayName(overrides.meta?.displayName ?? baseConfig.name);

    const records = loadRecentAnalyticsRecordsForStore(id, overrides);
    setRecentRecords(records);
    setSavedRecordsJson(JSON.stringify(records));

    if (baseConfig.template === "amazon-sales") {
      const snap = overrides.amazon?.snapshot;
      const agg = overrides.amazon?.aggregate;
      const defaults = getAmazonBundle(id).config.defaultAggregate;
      setKpiForm({
        ...EMPTY_KPI_FORM,
        totalOrderItems: String(
          snap?.totalOrderItems ??
            agg?.totalOrderItems ??
            defaults?.totalOrderItems ??
            ""
        ),
        unitsOrdered: String(
          snap?.unitsOrdered ?? agg?.unitsOrdered ?? defaults?.unitsOrdered ?? ""
        ),
        orderedProductSales: String(
          snap?.orderedProductSales ??
            agg?.orderedProductSales ??
            defaults?.orderedProductSales ??
            ""
        ),
        avgUnitsPerOrderItem: String(
          snap?.avgUnitsPerOrderItem ??
            agg?.avgUnitsPerOrderItem ??
            defaults?.avgUnitsPerOrderItem ??
            ""
        ),
        avgSalesPerOrderItem: String(
          snap?.avgSalesPerOrderItem ??
            agg?.avgSalesPerOrderItem ??
            defaults?.avgSalesPerOrderItem ??
            ""
        ),
        generatedAt: toDatetimeLocalValue(
          snap?.generatedAt ?? "2026-05-15T16:20:56-07:00"
        ),
      });
    } else {
      const bundle = getWalmartBundle(id);
      const sum = overrides.walmart?.summary ?? bundle.summary;
      setKpiForm({
        ...EMPTY_KPI_FORM,
        gmv: String(sum.gmv ?? ""),
        unitsSold: String(sum.unitsSold ?? ""),
        orders: String(sum.orders ?? ""),
        aur: String(sum.aur ?? ""),
      });
    }
  }, []);

  useEffect(() => {
    loadEditorState(storeId);
  }, [storeId, loadEditorState]);

  const handleSaveRecentAnalytics = () => {
    const anchorEnd =
      config.marketplace === "amazon"
        ? getStoreAnalyticsAnchorEnd("amazon", getAmazonBundle(storeId).config)
        : getStoreAnalyticsAnchorEnd("walmart", getWalmartBundle(storeId).config);
    const window = getRecentAnalyticsWindow(anchorEnd);
    const validated = validateRecentAnalyticsRecords(recentRecords, window);
    if (!validated.ok) {
      toast.error(validated.error);
      return;
    }
    const smoothed = interpolateRecentEdits(validated.records);
    const current = loadStoreOverrides(storeId) ?? {};
    const next = buildOverridesFromRecentRecords(storeId, smoothed, current);
    saveStoreOverrides(storeId, next);
    const reloaded = loadRecentAnalyticsRecordsForStore(storeId, next);
    setRecentRecords(reloaded);
    setSavedRecordsJson(JSON.stringify(reloaded));
    setOverridesJson(JSON.stringify(next, null, 2));
    notifyStoreOverridesUpdated();
    toast.success("Recent analytics saved — charts will refresh on open dashboards");
  };

  const handleCancelRecentAnalytics = () => {
    setRecentRecords(JSON.parse(savedRecordsJson) as RecentAnalyticsRecord[]);
  };

  const handleRestoreDefaultRecent = () => {
    const current = loadStoreOverrides(storeId) ?? {};
    const next: StoreOverrides = { ...current };
    delete next.recentAnalytics;
    if (next.amazon) {
      delete next.amazon.timeSeries;
      if (Object.keys(next.amazon).length === 0) delete next.amazon;
    }
    if (next.walmart) {
      delete next.walmart.tableRows;
      if (Object.keys(next.walmart).length === 0) delete next.walmart;
    }
    saveStoreOverrides(storeId, next);
    loadEditorState(storeId);
    notifyStoreOverridesUpdated();
    toast.success("Recent window reset to generated defaults");
  };

  const handleSaveKpis = () => {
    const current = loadStoreOverrides(storeId) ?? {};
    const next: StoreOverrides = { ...current };

    if (isAmazon) {
      const totalOrderItems = Number(kpiForm.totalOrderItems) || 0;
      const unitsOrdered = Number(kpiForm.unitsOrdered) || 0;
      const orderedProductSales = Number(kpiForm.orderedProductSales) || 0;
      const avgUnitsPerOrderItem = Number(kpiForm.avgUnitsPerOrderItem) || 0;
      const avgSalesPerOrderItem = Number(kpiForm.avgSalesPerOrderItem) || 0;
      const generatedAt = fromDatetimeLocalValue(kpiForm.generatedAt);

      const metrics = {
        label: "Selected date range",
        totalOrderItems,
        unitsOrdered,
        orderedProductSales,
        avgUnitsPerOrderItem,
        avgSalesPerOrderItem,
      };

      next.amazon = {
        ...next.amazon,
        snapshot: {
          ...metrics,
          generatedAt,
        },
        aggregate: {
          ...next.amazon?.aggregate,
          ...metrics,
        },
      };
    } else {
      next.walmart = {
        ...next.walmart,
        summary: {
          gmv: Number(kpiForm.gmv) || 0,
          unitsSold: Number(kpiForm.unitsSold) || 0,
          orders: Number(kpiForm.orders) || 0,
          aur: Number(kpiForm.aur) || 0,
        },
      };
    }

    saveStoreOverrides(storeId, next);
    setOverridesJson(JSON.stringify(next, null, 2));
    notifyStoreOverridesUpdated();
    toast.success("KPI overrides saved");
  };

  const handleSaveDisplayName = () => {
    const current = loadStoreOverrides(storeId) ?? {};
    const next: StoreOverrides = {
      ...current,
      meta: {
        ...current.meta,
        displayName: displayName.trim() || undefined,
      },
    };
    if (!next.meta?.displayName) {
      delete next.meta;
    }
    saveStoreOverrides(storeId, next);
    setOverridesJson(JSON.stringify(next, null, 2));
    notifyStoreOverridesUpdated();
    toast.success("Store name updated");
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(overridesJson) as StoreOverrides;
      saveStoreOverrides(storeId, parsed);
      loadEditorState(storeId);
      notifyStoreOverridesUpdated();
      toast.success("Overrides saved from JSON");
    } catch {
      toast.error("Invalid JSON");
    }
  };

  const handleReset = () => {
    clearStoreOverrides(storeId);
    loadEditorState(storeId);
    notifyStoreOverridesUpdated();
    toast.success("Reset to defaults");
  };

  const handleExport = () => {
    const blob = new Blob([overridesJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeId}-overrides.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Data editor</h1>
            <p className="text-sm text-muted-foreground">
              Internal tool — changes save to localStorage in this browser.
            </p>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to stores
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4">
          <div className="space-y-2">
            <Label>Store</Label>
            <Select
              value={storeId}
              onValueChange={(v) => setStoreId(v as StoreId)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STORES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" asChild>
            <Link href={config.routes.home} target="_blank">
              Open dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset overrides
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Export JSON
          </Button>
        </div>

        <Tabs defaultValue="analytics">
          <TabsList>
            <TabsTrigger value="analytics">
              Recent analytics{recentDirty ? " *" : ""}
            </TabsTrigger>
            <TabsTrigger value="kpi">KPIs</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent
            value="analytics"
            className="rounded-lg border bg-white p-6"
          >
            <AnalyticsRecordsEditor
              records={recentRecords}
              analyticsWindow={analyticsWindow}
              dirty={recentDirty}
              storeId={storeId}
              onChange={setRecentRecords}
              onSave={handleSaveRecentAnalytics}
              onCancel={handleCancelRecentAnalytics}
              onRestoreDefaults={handleRestoreDefaultRecent}
            />
          </TabsContent>
          <TabsContent value="kpi" className="space-y-6 rounded-lg border bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Store display name</Label>
                <p className="text-xs text-muted-foreground">
                  Shown in Amazon top navigation and marketplace selector. Walmart
                  uses Seller Center branding; name is stored for consistency across
                  admin and future headers.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="max-w-md"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={config.name}
                  />
                  <Button variant="outline" onClick={handleSaveDisplayName}>
                    Save name
                  </Button>
                </div>
              </div>
            </div>

            {isAmazon ? (
              <>
                <div>
                  <h2 className="text-base font-semibold text-[#111111]">
                    Amazon — Sales Snapshot KPIs
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Matches the five metrics on the Sales Snapshot section. Saving also
                    updates <code className="text-[11px]">amazon.aggregate</code> so
                    Compare Sales stays in sync. Advanced overrides:{" "}
                    <code className="text-[11px]">amazon.timeSeries</code>,{" "}
                    <code className="text-[11px]">amazon.asinAlerts</code> (JSON tab).
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Total order items</Label>
                    <Input
                      type="number"
                      value={kpiForm.totalOrderItems}
                      onChange={(e) =>
                        setKpiForm((f) => ({
                          ...f,
                          totalOrderItems: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Units ordered</Label>
                    <Input
                      type="number"
                      value={kpiForm.unitsOrdered}
                      onChange={(e) =>
                        setKpiForm((f) => ({ ...f, unitsOrdered: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ordered product sales ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpiForm.orderedProductSales}
                      onChange={(e) =>
                        setKpiForm((f) => ({
                          ...f,
                          orderedProductSales: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avg. units/order item</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpiForm.avgUnitsPerOrderItem}
                      onChange={(e) =>
                        setKpiForm((f) => ({
                          ...f,
                          avgUnitsPerOrderItem: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avg. sales/order item ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpiForm.avgSalesPerOrderItem}
                      onChange={(e) =>
                        setKpiForm((f) => ({
                          ...f,
                          avgSalesPerOrderItem: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label>Snapshot timestamp</Label>
                    <Input
                      type="datetime-local"
                      value={kpiForm.generatedAt}
                      onChange={(e) =>
                        setKpiForm((f) => ({ ...f, generatedAt: e.target.value }))
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Shown as &quot;taken at …&quot; on Sales Snapshot.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-base font-semibold text-[#111111]">
                    Walmart — Account sales summary KPIs
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Matches the four KPI cards on Account Sales Report. Values apply
                    when the dashboard uses this store&apos;s default date range (
                    {config.defaultDateRange.start} to {config.defaultDateRange.end}).
                    Chart series come from the Recent analytics tab. Advanced:{" "}
                    <code className="text-[11px]">walmart.timeSeries</code> (JSON tab).
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>GMV ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpiForm.gmv}
                      onChange={(e) =>
                        setKpiForm((f) => ({ ...f, gmv: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Units sold</Label>
                    <Input
                      type="number"
                      value={kpiForm.unitsSold}
                      onChange={(e) =>
                        setKpiForm((f) => ({ ...f, unitsSold: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Orders</Label>
                    <Input
                      type="number"
                      value={kpiForm.orders}
                      onChange={(e) =>
                        setKpiForm((f) => ({ ...f, orders: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>AUR ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpiForm.aur}
                      onChange={(e) =>
                        setKpiForm((f) => ({ ...f, aur: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </>
            )}
            <Button className="mt-6" onClick={handleSaveKpis}>
              Save KPI overrides
            </Button>
          </TabsContent>
          <TabsContent value="json" className="space-y-4 rounded-lg border bg-white p-6">
            <Label>Full overrides JSON</Label>
            <p className="text-xs text-muted-foreground">
              Includes <code className="text-[11px]">recentAnalytics</code> and platform
              slices. Full <code className="text-[11px]">amazon.timeSeries</code>{" "}
              replacement is advanced; prefer Recent analytics for the last five months.
            </p>
            <textarea
              className="min-h-[320px] w-full rounded-md border border-input bg-transparent p-3 font-mono text-xs"
              value={overridesJson}
              onChange={(e) => setOverridesJson(e.target.value)}
            />
            <Button onClick={handleSaveJson}>Save JSON</Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
