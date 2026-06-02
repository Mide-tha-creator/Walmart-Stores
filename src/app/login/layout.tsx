import type { Metadata } from "next";
import { PLATFORM_DESCRIPTION, PLATFORM_TITLE } from "@/lib/metadata/site-metadata";

export const metadata: Metadata = {
  title: `Sign in | ${PLATFORM_TITLE}`,
  description: PLATFORM_DESCRIPTION,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
