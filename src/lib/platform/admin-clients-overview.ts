import "server-only";

import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import type { ClientAccount } from "@/src/types/platform-tenant";
import { getEffectiveConnectionStatusAsync } from "@/src/lib/platform/effective-client";
import { listCandidates, listShortlists } from "@/src/lib/search-board/data";

export type SearchBoardSurfaceStatus =
  | "live"
  | "needs_mapping"
  | "no_token"
  | "hubspot_error";

export type AdminClientOverviewRow = {
  client: ClientAccount;
  hubspotConnection: Awaited<ReturnType<typeof getEffectiveConnectionStatusAsync>>;
  shortlistCount: number | null;
  candidateCount: number | null;
  searchBoard: SearchBoardSurfaceStatus;
};

export async function buildAdminClientOverviewRow(
  client: ClientAccount,
): Promise<AdminClientOverviewRow> {
  const hubspotConnection = await getEffectiveConnectionStatusAsync(client);

  if (!isHubSpotAccessTokenConfigured()) {
    return {
      client,
      hubspotConnection,
      shortlistCount: null,
      candidateCount: null,
      searchBoard: "no_token",
    };
  }

  const [sl, cand] = await Promise.all([
    listShortlists(client.id),
    listCandidates(client.id),
  ]);

  if (!sl.ok) {
    const code = sl.error.code;
    if (code === "no_token") {
      return {
        client,
        hubspotConnection,
        shortlistCount: null,
        candidateCount: null,
        searchBoard: "no_token",
      };
    }
    if (code === "no_mapping" || code === "incomplete_mapping") {
      return {
        client,
        hubspotConnection,
        shortlistCount: null,
        candidateCount: null,
        searchBoard: "needs_mapping",
      };
    }
    return {
      client,
      hubspotConnection,
      shortlistCount: null,
      candidateCount: null,
      searchBoard: "hubspot_error",
    };
  }

  if (!cand.ok) {
    return {
      client,
      hubspotConnection,
      shortlistCount: sl.shortlists.length,
      candidateCount: null,
      searchBoard: "hubspot_error",
    };
  }

  return {
    client,
    hubspotConnection,
    shortlistCount: sl.shortlists.length,
    candidateCount: cand.candidates.length,
    searchBoard: "live",
  };
}

export async function buildAdminClientsOverview(
  clients: ClientAccount[],
): Promise<AdminClientOverviewRow[]> {
  return Promise.all(clients.map((c) => buildAdminClientOverviewRow(c)));
}
