import "server-only";

import { getClientHubSpotLinkRecord } from "@/src/lib/platform/client-connection-store";
import { getClientAppInstallOverrides } from "@/src/lib/platform/client-install-overrides-store";
import type { ClientAccount, ClientConnectionStatus, InstalledAppView } from "@/src/types/platform-tenant";
import { getClientById, getInstalledAppsForClient } from "@/src/lib/platform/mock-data";

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

export function getInstalledAppsWithOverrides(clientId: string): InstalledAppView[] {
  const base = getInstalledAppsForClient(clientId);
  return base.map((row) => {
    const o = getClientAppInstallOverrides(clientId, row.app.id);
    if (!o) return row;
    return {
      ...row,
      enabled: o.enabled ?? row.enabled,
      mappingStatus: o.mappingStatus ?? row.mappingStatus,
    };
  });
}

export function getEnabledAppsWithOverrides(clientId: string): InstalledAppView[] {
  return getInstalledAppsWithOverrides(clientId).filter((install) => install.enabled);
}

export function requireClientOrNull(id: string): ClientAccount | null {
  return getClientById(id) ?? null;
}
