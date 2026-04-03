import "server-only";

import { notFound } from "next/navigation";

import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import { getClientAccountBySlug } from "@/src/lib/platform/client-accounts-repo";
import type { ClientAccount } from "@/src/types/platform-tenant";

/**
 * Resolves `/clients/[slug]` to the current workspace tenant (session + admin dev cookie).
 */
export async function requireClientWorkspaceBySlug(
  slug: string,
): Promise<ClientAccount> {
  const workspaceId = await getWorkspaceClientId();
  const client = await getClientAccountBySlug(decodeURIComponent(slug));
  if (!client || client.id !== workspaceId) {
    notFound();
  }
  return client;
}
