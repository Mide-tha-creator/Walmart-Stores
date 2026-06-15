import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store/store-context";
import { StoreShell } from "@/components/engine/store-shell";
import {
  isValidAccountSlug,
  resolveAccountToStoreId,
} from "@/lib/navigation/account-registry";
import { getStoreConfig } from "@/config/stores/registry";
import {
  getStorePageMetadata,
  PLATFORM_TITLE,
} from "@/lib/metadata/site-metadata";
import type { StoreId } from "@/config/stores/types";

export function generateAccountMetadata(account: string): Metadata {
  const storeId = resolveAccountToStoreId(account);
  if (!storeId) {
    return { title: PLATFORM_TITLE };
  }
  return getStorePageMetadata(getStoreConfig(storeId));
}

interface AccountStoreLayoutProps {
  account: string;
  children: React.ReactNode;
}

export function AccountStoreLayout({
  account,
  children,
}: AccountStoreLayoutProps) {
  if (!isValidAccountSlug(account)) {
    notFound();
  }

  const storeId = resolveAccountToStoreId(account)!;

  return (
    <StoreProvider storeId={storeId as StoreId}>
      <StoreShell>{children}</StoreShell>
    </StoreProvider>
  );
}
