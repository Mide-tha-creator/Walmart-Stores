"use client";

import { WalmartShellLayout } from "@/components/layouts/walmart-shell-layout";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return <WalmartShellLayout>{children}</WalmartShellLayout>;
}
