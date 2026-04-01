import "server-only";

import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import { hubspotListCrmObjectsPage } from "@/src/lib/hubspot/crm-objects";
import type { HubSpotCrmObjectRow } from "@/src/lib/hubspot/crm-objects";
import { getClientAppMapping } from "@/src/lib/platform/client-app-mapping-store";

const CANDIDATE_PROPS = [
  "candidate_name",
  "current_title",
  "status",
  "location",
] as const;

export type CandidatesPreviewResult =
  | {
      kind: "ready";
      objectTypeId: string;
      rows: HubSpotCrmObjectRow[];
      errorMessage?: string;
    }
  | { kind: "no_mapping" }
  | { kind: "no_object_type" }
  | { kind: "no_token" };

export async function loadSearchBoardCandidatesPreview(clientId: string): Promise<CandidatesPreviewResult> {
  if (!isHubSpotAccessTokenConfigured()) {
    return { kind: "no_token" };
  }

  const mapping = getClientAppMapping(clientId, "search_board");
  if (!mapping) {
    return { kind: "no_mapping" };
  }

  const objectTypeId = mapping.hubspot.objects.candidate?.objectTypeId?.trim();
  if (!objectTypeId) {
    return { kind: "no_object_type" };
  }

  const res = await hubspotListCrmObjectsPage(objectTypeId, {
    limit: 15,
    properties: [...CANDIDATE_PROPS],
  });

  if (!res.ok) {
    return {
      kind: "ready",
      objectTypeId,
      rows: [],
      errorMessage: res.message,
    };
  }

  return {
    kind: "ready",
    objectTypeId,
    rows: res.data.results ?? [],
  };
}
