import { getClientAccountBySlug } from "@/src/lib/platform/client-accounts-repo";
import { HubspotAiImplementationBuilderClient } from "@/src/components/admin/hubspot-ai-implementation-builder-client";

export default async function HubspotAiImplementationBuilderPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const client = await getClientAccountBySlug(clientSlug);
  if (!client) {
    return null;
  }

  return (
    <HubspotAiImplementationBuilderClient
      clientSlug={client.slug}
      defaultPortalId={client.hubspotPortalId}
      clientName={client.name}
    />
  );
}
