import "server-only";

import { hubspotApiGetJson, type HubSpotJsonResult } from "@/src/lib/hubspot/http";

export type HubSpotCrmObjectRow = {
  id: string;
  properties: Record<string, string | null | undefined>;
};

type ListResponse = {
  results?: HubSpotCrmObjectRow[];
  paging?: { next?: { after?: string } };
};

/** List CRM objects by fully-qualified type id (e.g. `2-12345678`). */
export async function hubspotListCrmObjectsPage(
  objectTypeId: string,
  options: { limit?: number; properties?: string[]; after?: string },
): Promise<HubSpotJsonResult<ListResponse>> {
  const limit = options.limit ?? 20;
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (options.properties?.length) {
    q.set("properties", options.properties.join(","));
  }
  if (options.after) {
    q.set("after", options.after);
  }
  const path = `/crm/v3/objects/${encodeURIComponent(objectTypeId)}?${q.toString()}`;
  return hubspotApiGetJson<ListResponse>(path);
}
