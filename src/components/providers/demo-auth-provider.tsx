"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface DemoUser {
  email: string;
  name: string;
}

interface DemoAuthContextValue {
  user: DemoUser | null;
  login: (email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const STORAGE_KEY = "demo-auth-session";

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as DemoUser);
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback((email: string) => {
    const next: DemoUser = {
      email,
      name: "Walmart Seller Center",
    };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <DemoAuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) {
    throw new Error("useDemoAuth must be used within DemoAuthProvider");
  }
  return ctx;
}
