"use client";

import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AsinAlert, AsinAlertCategory } from "@/types/amazon";

const SALES_DASHBOARD_PILLS: { id: AsinAlertCategory; label: string }[] = [
  { id: "declining_sales", label: "Products with Declining Sales" },
  { id: "increasing_sales", label: "Products with Increasing Sales" },
  { id: "growth_opportunities", label: "Products with Growth Opportunities" },
];

const FILTER_OPTIONS: { id: AsinAlertCategory; label: string }[] = [
  ...SALES_DASHBOARD_PILLS,
  { id: "declining_traffic", label: "Declining Traffic Products" },
  { id: "below_market_average", label: "Products Below Market Average" },
  { id: "top_sales_products", label: "Top Sales Products" },
];

interface AsinPerformanceSectionProps {
  alerts: AsinAlert[];
  title?: string;
  comparisonLabel?: string;
  defaultAsinCategory?: AsinAlertCategory;
  layout?: "carousel" | "horizontal";
}

function AsinCard({
  product,
  layout,
}: {
  product: AsinAlert;
  layout: "carousel" | "horizontal";
}) {
  if (layout === "horizontal") {
    return (
      <article className="flex gap-3 rounded-sm border border-[#d5d9d9] bg-white p-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-[#f3f5f6] sm:h-[72px] sm:w-[72px]">
          <ProductImage
            asin={product.asin}
            src={product.imageUrl}
            alt={product.title}
            sizes="72px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="line-clamp-2 text-[12px] font-medium leading-snug text-[#111111]">
            {product.title}
          </p>
          <p className="mt-0.5 text-[10px] text-[#565959]">{product.asin}</p>
          <p className="mt-1.5 text-[12px] text-[#111111]">{product.metricLabel}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-[30px] w-fit rounded-sm border-[#007185] bg-white px-3 text-[12px] font-bold text-[#007185] hover:bg-[#e7f4f5]"
          >
            View Details
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-sm border border-[#d5d9d9] bg-white p-2.5">
      <div className="relative mb-2 h-[88px] w-full overflow-hidden rounded-sm bg-[#f3f5f6]">
        <ProductImage
          asin={product.asin}
          src={product.imageUrl}
          alt={product.title}
          sizes="140px"
        />
      </div>
      <p className="line-clamp-2 min-h-[32px] text-[12px] font-medium leading-snug text-[#111111]">
        {product.title}
      </p>
      <p className="mt-0.5 text-[10px] text-[#565959]">{product.asin}</p>
      <p className="mt-1.5 flex-1 text-[12px] text-[#111111]">{product.metricLabel}</p>
      <Button
        size="sm"
        variant="outline"
        className="mt-2 h-[30px] w-full rounded-sm border-[#007185] bg-white text-[12px] font-bold text-[#007185] hover:bg-[#e7f4f5]"
      >
        View Details
      </Button>
    </article>
  );
}

export function AsinPerformanceSection({
  alerts,
  title = "Deep dive into your sales",
  comparisonLabel = "Compared to prior week (May 4 – May 10, 2024)",
  defaultAsinCategory = "declining_sales",
  layout = "carousel",
}: AsinPerformanceSectionProps) {
  const [filter, setFilter] = useState<AsinAlertCategory>(defaultAsinCategory);
  const [hidden, setHidden] = useState(false);
  const [page, setPage] = useState(0);

  const pillOptions = useMemo(() => {
    if (layout === "horizontal") return FILTER_OPTIONS;
    const categoriesWithData = new Set(alerts.map((a) => a.category));
    return SALES_DASHBOARD_PILLS.filter(
      (opt) =>
        categoriesWithData.has(opt.id) ||
        opt.id === defaultAsinCategory ||
        opt.id === "declining_sales"
    );
  }, [alerts, defaultAsinCategory, layout]);

  const filtered = useMemo(
    () => alerts.filter((a) => a.category === filter),
    [alerts, filter]
  );

  const pageSize = layout === "horizontal" ? 1 : 4;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const showCarouselNav = layout === "carousel" && filtered.length > 0;

  if (hidden) {
    return (
      <div className="border-b border-[#d5d9d9] bg-white px-4 py-2 md:px-5">
        <button
          type="button"
          className="text-[12px] text-[#007185] hover:underline"
          onClick={() => setHidden(false)}
        >
          Show ASIN performance
        </button>
      </div>
    );
  }

  return (
    <section className="border-b border-[#d5d9d9] bg-white px-4 py-3 md:px-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[#111111]">{title}</h2>
          <p className="text-[11px] text-[#565959]">{comparisonLabel}</p>
        </div>
        <button
          type="button"
          className="shrink-0 text-[12px] text-[#007185] hover:underline"
          onClick={() => setHidden(true)}
        >
          Hide ASINs
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {pillOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setFilter(opt.id);
                setPage(0);
              }}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                filter === opt.id
                  ? "bg-[#008296] text-white"
                  : "border border-[#d5d9d9] bg-white text-[#111111] hover:bg-[#f3f5f6]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Select defaultValue="prior-week">
          <SelectTrigger className="h-[30px] w-[110px] shrink-0 rounded-sm bg-white text-[12px]">
            <SelectValue placeholder="Prior Week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prior-week">Prior Week</SelectItem>
            <SelectItem value="prior-month">Prior Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#565959]">
          No products in this category for the selected period.
        </p>
      ) : (
        <div className="relative px-6 sm:px-8">
          {showCarouselNav && (
            <>
              <div className="absolute left-0 top-[42%] z-10 -translate-y-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-[#d5d9d9] bg-white"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-label="Previous products"
                >
                  <ChevronLeft className="h-4 w-4 text-[#565959]" />
                </Button>
              </div>
              <div className="absolute right-0 top-[42%] z-10 -translate-y-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-[#d5d9d9] bg-white"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  aria-label="Next products"
                >
                  <ChevronRight className="h-4 w-4 text-[#565959]" />
                </Button>
              </div>
            </>
          )}
          <div
            className={cn(
              layout === "horizontal"
                ? "max-w-2xl"
                : "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
            )}
          >
            {visible.map((product) => (
              <AsinCard key={product.asin} product={product} layout={layout} />
            ))}
          </div>
        </div>
      )}

      {showCarouselNav && totalPages > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              aria-current={i === page ? "true" : undefined}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === page ? "bg-[#008296]" : "bg-[#d5d9d9]"
              )}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
