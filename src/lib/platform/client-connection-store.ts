import "server-only";

import type { ClientConnectionStatus } from "@/src/types/platform-tenant";

/**
 * Dev-mode HubSpot link state per client (replace with DB rows later).
 */
export interface ClientHubSpotLinkRecord {
  clientId: string;
  /** Effective platform connection status after a successful Connect action. */
  status: ClientConnectionStatus;
  /** Portal id returned from HubSpot token introspection. */
  verifiedTokenPortalId: string;
  /** Whether verifiedTokenPortalId matches the client account record. */
  portalMatchesClientRecord: boolean;
  updatedAt: string;
}

const memory = new Map<string, ClientHubSpotLinkRecord>();

export function getClientHubSpotLinkRecord(
  clientId: string,
): ClientHubSpotLinkRecord | undefined {
  return memory.get(clientId);
}

export function setClientHubSpotLinkRecord(record: ClientHubSpotLinkRecord): void {
  memory.set(record.clientId, record);
}

export function clearClientHubSpotLinkRecord(clientId: string): void {
  memory.delete(clientId);
}
