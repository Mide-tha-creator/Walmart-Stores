export type Marketplace = "walmart";

export type DashboardTemplate = "walmart-insights";

export interface StoreBranding {
  primary: string;
  primaryHover?: string;
  topnavBg?: string;
  pageBg?: string;
  sidebarBg?: string;
  chartAccent?: string;
  chartPurple?: string;
}

export interface StoreTopNavUi {
  searchPlaceholder?: string;
  messageBadge?: number;
  notificationBadge?: number;
}

export interface StoreConfig {
  id: string;
  name: string;
  marketplace: Marketplace;
  template: DashboardTemplate;
  description: string;
  logo: { src: string; alt: string };
  branding: StoreBranding;
  defaultDateRange: { start: string; end: string };
  regionLabel: string;
  routes: {
    home: string;
  };
  topNav?: StoreTopNavUi;
}

export type StoreId = "walmart-main" | "walmart-second";
