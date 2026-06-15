import { getAllAccountSlugs } from "@/lib/navigation/account-registry";
import {
  AccountStoreLayout,
  generateAccountMetadata,
} from "@/components/engine/account-store-layout";

export function generateStaticParams() {
  return getAllAccountSlugs()
    .filter(
      (slug) => slug === "us-marketplace" || slug === "us-marketplace-2"
    )
    .map((account) => ({ account }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  return generateAccountMetadata(account);
}

export default async function WalmartAccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  return (
    <AccountStoreLayout account={account}>
      {children}
    </AccountStoreLayout>
  );
}
