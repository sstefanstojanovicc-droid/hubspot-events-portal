import "server-only";

import type { ClientAccount, ClientConnectionStatus } from "@/src/types/platform-tenant";
import { prisma } from "@/src/lib/prisma";

function mapRow(row: {
  id: string;
  name: string;
  slug: string;
  hubspotPortalId: string;
  websiteUrl: string;
  primaryContactsJson: string;
  connectionStatus: string;
  createdAt: Date;
  lastHubspotSyncAt: Date | null;
}): ClientAccount {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    hubspotPortalId: row.hubspotPortalId,
    websiteUrl: row.websiteUrl,
    primaryContactsJson: row.primaryContactsJson,
    connectionStatus: row.connectionStatus as ClientConnectionStatus,
    createdAt: row.createdAt,
    lastHubspotSyncAt: row.lastHubspotSyncAt,
  };
}

export async function listClientAccounts(): Promise<ClientAccount[]> {
  const rows = await prisma.clientAccount.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapRow);
}

export async function getClientAccountById(
  id: string,
): Promise<ClientAccount | null> {
  const row = await prisma.clientAccount.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}

export async function getClientAccountBySlug(
  slug: string,
): Promise<ClientAccount | null> {
  const row = await prisma.clientAccount.findUnique({ where: { slug } });
  return row ? mapRow(row) : null;
}

export type CreateClientAccountInput = {
  id?: string;
  name: string;
  slug: string;
  hubspotPortalId: string;
  connectionStatus?: ClientConnectionStatus;
};

export async function createClientAccountRecord(
  input: CreateClientAccountInput,
): Promise<ClientAccount> {
  const status = input.connectionStatus ?? "ready_to_connect";
  const data: {
    id?: string;
    name: string;
    slug: string;
    hubspotPortalId: string;
    connectionStatus: ClientConnectionStatus;
  } = {
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    hubspotPortalId: input.hubspotPortalId.trim(),
    connectionStatus: status,
  };
  if (input.id?.trim()) {
    data.id = input.id.trim();
  }
  const row = await prisma.clientAccount.create({ data });
  return mapRow(row);
}

export async function touchClientHubSpotSyncAt(clientId: string): Promise<void> {
  await prisma.clientAccount.update({
    where: { id: clientId },
    data: { lastHubspotSyncAt: new Date() },
  });
}

export type UpdateWorkspaceProfileInput = {
  clientAccountId: string;
  websiteUrl?: string;
  primaryContactsJson?: string;
};

export async function updateClientWorkspaceProfile(
  input: UpdateWorkspaceProfileInput,
): Promise<ClientAccount> {
  const row = await prisma.clientAccount.update({
    where: { id: input.clientAccountId },
    data: {
      ...(input.websiteUrl !== undefined
        ? { websiteUrl: input.websiteUrl.trim() }
        : {}),
      ...(input.primaryContactsJson !== undefined
        ? { primaryContactsJson: input.primaryContactsJson.trim() }
        : {}),
    },
  });
  return mapRow(row);
}
