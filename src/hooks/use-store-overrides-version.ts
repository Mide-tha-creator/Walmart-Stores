"use client";

import { useSyncExternalStore } from "react";
import { getStoreOverridesKey } from "@/lib/store/storage-keys";
import type { StoreId } from "@/config/stores/types";

let globalVersion = 0;

function bumpVersion() {
  globalVersion += 1;
}

function subscribe(storeId: StoreId, onStoreChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === getStoreOverridesKey(storeId) || e.key === null) {
      bumpVersion();
      onStoreChange();
    }
  };
  const onCustom = () => {
    bumpVersion();
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("store-overrides-updated", onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("store-overrides-updated", onCustom);
  };
}

export function useStoreOverridesVersion(storeId: StoreId): number {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(storeId, onStoreChange),
    () => globalVersion,
    () => 0
  );
}
