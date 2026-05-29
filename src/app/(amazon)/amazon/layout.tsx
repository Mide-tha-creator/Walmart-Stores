import type { Metadata } from "next";
import {
  AMAZON_DESCRIPTION,
  AMAZON_TAB_TITLE,
  getStoreIconsMetadata,
} from "@/lib/metadata/site-metadata";

export const metadata: Metadata = {
  title: AMAZON_TAB_TITLE,
  description: AMAZON_DESCRIPTION,
  icons: getStoreIconsMetadata("amazon"),
};

export default function AmazonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
