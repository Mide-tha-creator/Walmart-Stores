import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ALL_STORES } from "@/config/stores/registry";
import { PLATFORM_DESCRIPTION, PLATFORM_TITLE } from "@/lib/metadata/site-metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: PLATFORM_TITLE,
  description: PLATFORM_DESCRIPTION,
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-[#e5e7eb] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-lg font-semibold text-[#111111]">
            Seller Analytics Platform
          </h1>
          <Link
            href="/admin"
            className="text-sm text-[#565959] hover:text-[#007185]"
          >
            Data editor
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[#565959]">
          Select a store
        </p>
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#111111] md:text-4xl">
          Marketplace analytics
        </h2>
        <p className="mb-12 max-w-2xl text-[#565959]">
          Choose a seller account to open business reports, sales dashboards, and
          marketplace performance insights.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {ALL_STORES.map((store) => (
            <Link
              key={store.id}
              href={store.routes.home}
              className={cn(
                "group flex flex-col rounded-xl border border-[#d5d9d9] bg-white p-6 text-left shadow-sm transition hover:shadow-md",
                store.marketplace === "amazon"
                  ? "hover:border-[#008296]"
                  : "hover:border-[#0071ce]"
              )}
            >
              <div
                className={cn(
                  "mb-4 inline-flex w-fit",
                  store.marketplace === "amazon" &&
                    "rounded bg-[#002f36] px-3 py-2"
                )}
              >
                <Image
                  src={store.logo.src}
                  alt={store.logo.alt}
                  width={store.marketplace === "amazon" ? 430 : 160}
                  height={store.marketplace === "amazon" ? 80 : 36}
                  className={cn(
                    "w-auto object-contain object-left",
                    store.marketplace === "amazon" ? "h-7" : "h-9"
                  )}
                />
              </div>
              <h3 className="text-xl font-bold text-[#111111]">{store.name}</h3>
              <p className="mt-2 flex-1 text-sm text-[#565959]">
                {store.description}
              </p>
              <span
                className={cn(
                  "mt-4 inline-flex items-center text-sm font-medium",
                  store.marketplace === "amazon" ? "text-[#008296]" : "text-[#0071ce]"
                )}
              >
                Open dashboard
                <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
