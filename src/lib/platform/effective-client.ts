import "server-only";

import { introspectHubSpotAccessToken } from "@/src/lib/hubspot/connection";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import { getClientAppMapping } from "@/src/lib/platform/client-app-mapping-store";
import { getClientHubSpotLinkRecord } from "@/src/lib/platform/client-connection-store";
import { getClientAppInstallOverrides } from "@/src/lib/platform/client-install-overrides-store";
import { ensureSearchBoardMappingHydrated } from "@/src/lib/search-board/search-board-hydration";
import type { ClientAccount, ClientConnectionStatus, InstalledAppView } from "@/src/types/platform-tenant";
import { getClientAccountById } from "@/src/lib/platform/client-accounts-repo";
import { getInstalledAppsForClient } from "@/src/lib/platform/mock-data";

export function getEffectiveConnectionStatus(
  client: ClientAccount,
): ClientConnectionStatus {
  const link = getClientHubSpotLinkRecord(client.id);
  if (link?.status === "attention_needed") return "attention_needed";
  if (link?.status === "connected" && link.portalMatchesClientRecord) {
    return "connected";
  }
  return client.connectionStatus;
}

/**
 * When the in-memory “Connect HubSpot” row is empty (typical on Vercel cold starts), treat a private-app
 * token whose portal matches {@link ClientAccount.hubspotPortalId} as connected.
 */
export async function getEffectiveConnectionStatusAsync(
  client: ClientAccount,
): Promise<ClientConnectionStatus> {
  const sync = getEffectiveConnectionStatus(client);
  if (sync === "attention_needed") {
    return "attention_needed";
  }
  if (sync === "connected") {
    return "connected";
  }
  if (!isHubSpotAccessTokenConfigured()) {
    return sync;
  }
  const intro = await introspectHubSpotAccessToken();
  if (!intro.ok) {
    return sync;
  }
  if (intro.portalId === String(client.hubspotPortalId)) {
    return "connected";
  }
  return "attention_needed";
}

function mappingStatusFromSearchBoardRow(clientId: string): InstalledAppView["mappingStatus"] {
  const mapping = getClientAppMapping(clientId, "search_board");
  if (!mapping) return "not_started";
  const report = mapping.lastInstallReport;
  if (report?.ok === false) return "install_failed";
  const c = mapping.hubspot.objects.candidate?.objectTypeId?.trim();
  const s = mapping.hubspot.objects.shortlist?.objectTypeId?.trim();
  const e = mapping.hubspot.objects.shortlist_entry?.objectTypeId?.trim();
  const a1 = mapping.hubspot.associationTypeIds.entry_shortlist?.trim();
  const a2 = mapping.hubspot.associationTypeIds.entry_candidate?.trim();
  if (!c || !s || !e || !a1 || !a2) return "in_progress";
  return "configured";
}

export function getInstalledAppsWithOverrides(clientId: string): InstalledAppView[] {
  const base = getInstalledAppsForClient(clientId);
  return base.map((row) => {
    const o = getClientAppInstallOverrides(clientId, row.app.id);
    const derivedStatus =
      row.app.key === "search_board" ? mappingStatusFromSearchBoardRow(clientId) : row.mappingStatus;
    if (!o) {
      return row.app.key === "search_board"
        ? { ...row, mappingStatus: derivedStatus }
        : row;
    }
    return {
      ...row,
      enabled: o.enabled ?? row.enabled,
      mappingStatus:
        row.app.key === "search_board"
          ? derivedStatus
          : o.mappingStatus ?? row.mappingStatus,
    };
  });
}

export async function getInstalledAppsWithOverridesAsync(
  clientId: string,
): Promise<InstalledAppView[]> {
  await ensureSearchBoardMappingHydrated(clientId);
  return getInstalledAppsWithOverrides(clientId);
}

export function getEnabledAppsWithOverrides(clientId: string): InstalledAppView[] {
  return getInstalledAppsWithOverrides(clientId).filter((install) => install.enabled);
}

export async function getEnabledAppsWithOverridesAsync(clientId: string): Promise<InstalledAppView[]> {
  return (await getInstalledAppsWithOverridesAsync(clientId)).filter((install) => install.enabled);
}

export async function requireClientOrNull(id: string): Promise<ClientAccount | null> {
  return getClientAccountById(id);
}
