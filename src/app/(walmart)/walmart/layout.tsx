import type { Metadata } from "next";
import {
  getStoreIconsMetadata,
  WALMART_DESCRIPTION,
  WALMART_TAB_TITLE,
} from "@/lib/metadata/site-metadata";

export const metadata: Metadata = {
  title: WALMART_TAB_TITLE,
  description: WALMART_DESCRIPTION,
  icons: getStoreIconsMetadata("walmart"),
};

export default function WalmartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
