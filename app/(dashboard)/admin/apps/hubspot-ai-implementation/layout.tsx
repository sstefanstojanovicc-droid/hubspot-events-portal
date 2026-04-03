import type { ReactNode } from "react";

import { listClientAccounts } from "@/src/lib/platform/client-accounts-repo";

import { HubspotAiAppShell } from "./hubspot-ai-app-shell";

export default async function HubspotAiImplementationLayout({ children }: { children: ReactNode }) {
  const clients = await listClientAccounts();

  return (
    <HubspotAiAppShell clients={clients.map((c) => ({ slug: c.slug, name: c.name }))}>
      {children}
    </HubspotAiAppShell>
  );
}
