"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  /** Walmart desktop: full labeled sidebar when true; icon-only rail when false */
  walmartExpanded: boolean;
  mobileOpen: boolean;
  setWalmartExpanded: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
  toggleWalmartSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [walmartExpanded, setWalmartExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedWalmart = localStorage.getItem("walmart-sidebar-expanded");
    if (storedWalmart === "true") setWalmartExpanded(true);
  }, []);

  const toggleWalmartSidebar = useCallback(() => {
    setWalmartExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("walmart-sidebar-expanded", String(next));
      return next;
    });
  }, []);

  const setWalmartExpandedPersisted = useCallback((v: boolean) => {
    setWalmartExpanded(v);
    localStorage.setItem("walmart-sidebar-expanded", String(v));
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        walmartExpanded,
        mobileOpen,
        setWalmartExpanded: setWalmartExpandedPersisted,
        setMobileOpen,
        toggleWalmartSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
