import "server-only";

import { getClientAppMapping } from "@/src/lib/platform/client-app-mapping-store";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import { persistSearchBoardInstallFromSnapshot } from "@/src/lib/provisioning/persist-search-board-install";

const verbose =
  process.env.SEARCH_BOARD_VERBOSE_LOG === "1" ||
  process.env.SEARCH_BOARD_VERBOSE_LOG === "true";

export function searchBoardRuntimeLog(
  event: string,
  payload: Record<string, unknown>,
): void {
  console.log(`[search-board] ${JSON.stringify({ event, ...payload })}`);
}

/**
 * True when HubSpot object type ids and entry association type ids are present in the platform mapping row.
 * Vercel serverless uses an in-memory store; this row may be empty on a cold start even after a successful install.
 * {@link ensureSearchBoardMappingHydrated} refetches HubSpot schema and repopulates the row.
 */
export function isSearchBoardMappingHydrationComplete(clientId: string): boolean {
  const mapping = getClientAppMapping(clientId, "search_board");
  if (!mapping) return false;
  const c = mapping.hubspot.objects.candidate?.objectTypeId?.trim();
  const s = mapping.hubspot.objects.shortlist?.objectTypeId?.trim();
  const e = mapping.hubspot.objects.shortlist_entry?.objectTypeId?.trim();
  const a1 = mapping.hubspot.associationTypeIds.entry_shortlist?.trim();
  const a2 = mapping.hubspot.associationTypeIds.entry_candidate?.trim();
  return Boolean(c && s && e && a1 && a2);
}

/**
 * Refetches HubSpot custom schema and writes the Search Board mapping row when the in-memory map is incomplete.
 * Safe on every request: skips work when mapping is already complete.
 */
export async function ensureSearchBoardMappingHydrated(clientId: string): Promise<void> {
  if (!isHubSpotAccessTokenConfigured()) {
    if (verbose) searchBoardRuntimeLog("hydrate-skip-no-token", { clientId });
    return;
  }
  if (isSearchBoardMappingHydrationComplete(clientId)) {
    if (verbose) searchBoardRuntimeLog("hydrate-skip-complete", { clientId });
    return;
  }

  searchBoardRuntimeLog("hydrate-start", { clientId });

  const res = await persistSearchBoardInstallFromSnapshot(clientId);

  if (!res.ok) {
    searchBoardRuntimeLog("hydrate-persist-failed", { clientId, message: res.message });
    return;
  }

  if (!isSearchBoardMappingHydrationComplete(clientId)) {
    searchBoardRuntimeLog("hydrate-still-incomplete", {
      clientId,
      persistMessage: res.message,
      mappingAfter: summarizeMappingSnippet(clientId),
    });
    return;
  }

  searchBoardRuntimeLog("hydrate-ok", { clientId, message: res.message });
}

export function summarizeMappingSnippet(clientId: string): Record<string, unknown> | null {
  const mapping = getClientAppMapping(clientId, "search_board");
  if (!mapping) return null;
  return {
    updatedAt: mapping.updatedAt,
    objectTypeIds: {
      candidate: mapping.hubspot.objects.candidate?.objectTypeId ?? null,
      shortlist: mapping.hubspot.objects.shortlist?.objectTypeId ?? null,
      shortlist_entry: mapping.hubspot.objects.shortlist_entry?.objectTypeId ?? null,
    },
    associationTypeIds: { ...mapping.hubspot.associationTypeIds },
  };
}
