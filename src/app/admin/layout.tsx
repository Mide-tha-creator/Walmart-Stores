import type { Metadata } from "next";
import { PLATFORM_DESCRIPTION, PLATFORM_TITLE } from "@/lib/metadata/site-metadata";

export const metadata: Metadata = {
  title: `Data configuration | ${PLATFORM_TITLE}`,
  description: PLATFORM_DESCRIPTION,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
