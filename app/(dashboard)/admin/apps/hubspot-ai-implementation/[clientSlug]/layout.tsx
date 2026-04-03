import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getClientAccountBySlug } from "@/src/lib/platform/client-accounts-repo";

export default async function HubspotAiClientLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const client = await getClientAccountBySlug(clientSlug);
  if (!client) {
    notFound();
  }
  return <>{children}</>;
}
