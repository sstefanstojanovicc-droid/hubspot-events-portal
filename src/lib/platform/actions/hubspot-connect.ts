"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/src/lib/auth/guards";
import { introspectHubSpotAccessToken } from "@/src/lib/hubspot/connection";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import { setClientHubSpotLinkRecord } from "@/src/lib/platform/client-connection-store";
import { getClientAccountById } from "@/src/lib/platform/client-accounts-repo";
import { logActivity } from "@/src/lib/workspace/activity-log";

export type ConnectHubSpotActionState = { ok: boolean; message: string };

export async function connectHubSpotForClientAction(
  _prev: ConnectHubSpotActionState | undefined,
  formData: FormData,
): Promise<ConnectHubSpotActionState> {
  const session = await requirePlatformAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const afterSuccess = String(formData.get("afterSuccess") ?? "");
  const client = await getClientAccountById(clientId);
  if (!client) {
    return { ok: false, message: "Unknown client." };
  }

  if (!isHubSpotAccessTokenConfigured()) {
    return {
      ok: false,
      message:
        "Set HUBSPOT_ACCESS_TOKEN in the server environment (e.g. .env.local locally, Vercel env vars in deployment).",
    };
  }

  const introspect = await introspectHubSpotAccessToken();
  if (!introspect.ok) {
    setClientHubSpotLinkRecord({
      clientId,
      status: "attention_needed",
      verifiedTokenPortalId: "",
      portalMatchesClientRecord: false,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath(`/admin/clients/${clientId}/apps/search-board/install`);
    return { ok: false, message: introspect.message };
  }

  const portalMatchesClientRecord = introspect.portalId === client.hubspotPortalId;
  const status = portalMatchesClientRecord ? "connected" : "attention_needed";

  setClientHubSpotLinkRecord({
    clientId,
    status,
    verifiedTokenPortalId: introspect.portalId,
    portalMatchesClientRecord,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/admin/clients/${clientId}/apps/search-board/install`);

  if (!portalMatchesClientRecord) {
    return {
      ok: false,
      message: `Token is for HubSpot portal ${introspect.portalId}, but this client account expects ${client.hubspotPortalId}.`,
    };
  }

  await logActivity({
    clientAccountId: clientId,
    userId: session.user.id,
    action: "hubspot.connected",
    entityType: "hubspot_connection",
    entityId: clientId,
    details: { portalId: introspect.portalId },
  });

  if (afterSuccess === "redirect-install") {
    redirect(
      `/admin/clients/${clientId}/apps/search-board/install?notify=hub-connected`,
    );
  }

  return {
    ok: true,
    message: `Connected to HubSpot portal ${introspect.portalId}.`,
  };
}
