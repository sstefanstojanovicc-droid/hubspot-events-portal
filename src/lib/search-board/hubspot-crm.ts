import "server-only";

import {
  hubspotApiDelete,
  hubspotApiGetJson,
  hubspotApiSendJson,
  type HubSpotJsonResult,
} from "@/src/lib/hubspot/http";
import type { HubSpotCrmObjectRow } from "@/src/lib/hubspot/crm-objects";
import { hubspotListCrmObjectsPage } from "@/src/lib/hubspot/crm-objects";

export type { HubSpotCrmObjectRow };

export async function hubspotFetchAllObjectPages(
  objectTypeId: string,
  properties: string[],
  options?: { maxPages?: number; pageSize?: number },
): Promise<{ ok: true; rows: HubSpotCrmObjectRow[] } | { ok: false; message: string }> {
  const maxPages = options?.maxPages ?? 30;
  const pageSize = options?.pageSize ?? 100;
  const rows: HubSpotCrmObjectRow[] = [];
  let after: string | undefined;

  for (let p = 0; p < maxPages; p++) {
    const res = await hubspotListCrmObjectsPage(objectTypeId, {
      limit: pageSize,
      properties,
      after,
    });
    if (!res.ok) {
      return { ok: false, message: res.message };
    }
    const batch = res.data.results ?? [];
    rows.push(...batch);
    after = res.data.paging?.next?.after;
    if (!after || batch.length === 0) {
      break;
    }
  }

  return { ok: true, rows };
}

export async function hubspotGetCrmObject(
  objectTypeId: string,
  recordId: string,
  properties: string[],
): Promise<HubSpotJsonResult<HubSpotCrmObjectRow>> {
  const q = new URLSearchParams();
  if (properties.length) {
    q.set("properties", properties.join(","));
  }
  const path = `/crm/v3/objects/${encodeURIComponent(objectTypeId)}/${encodeURIComponent(recordId)}?${q.toString()}`;
  return hubspotApiGetJson<HubSpotCrmObjectRow>(path);
}

type BatchReadResponse = { results?: HubSpotCrmObjectRow[]; status?: string; message?: string };

export async function hubspotBatchReadObjects(
  objectTypeId: string,
  ids: string[],
  properties: string[],
): Promise<HubSpotJsonResult<BatchReadResponse>> {
  if (ids.length === 0) {
    return { ok: true, data: { results: [] } };
  }
  const body = {
    properties,
    inputs: ids.map((id) => ({ id })),
  };
  return hubspotApiSendJson<BatchReadResponse>(
    `/crm/v3/objects/${encodeURIComponent(objectTypeId)}/batch/read`,
    { method: "POST", body },
  );
}

type CreateResponse = HubSpotCrmObjectRow;

export async function hubspotCreateCrmObject(
  objectTypeId: string,
  properties: Record<string, string | number | undefined>,
): Promise<HubSpotJsonResult<CreateResponse>> {
  const props: Record<string, string> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === undefined || v === "") continue;
    props[k] = String(v);
  }
  return hubspotApiSendJson<CreateResponse>(`/crm/v3/objects/${encodeURIComponent(objectTypeId)}`, {
    method: "POST",
    body: { properties: props },
  });
}

export async function hubspotPatchCrmObject(
  objectTypeId: string,
  recordId: string,
  properties: Record<string, string | number | undefined>,
): Promise<HubSpotJsonResult<HubSpotCrmObjectRow>> {
  const props: Record<string, string> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === undefined) continue;
    props[k] = String(v);
  }
  return hubspotApiSendJson<HubSpotCrmObjectRow>(
    `/crm/v3/objects/${encodeURIComponent(objectTypeId)}/${encodeURIComponent(recordId)}`,
    { method: "PATCH", body: { properties: props } },
  );
}

/** v4 association read: IDs of objects of `toObjectType` associated with `from` record. */
export async function hubspotGetAssociatedObjectIds(
  fromObjectTypeId: string,
  fromRecordId: string,
  toObjectTypeId: string,
): Promise<HubSpotJsonResult<{ results?: unknown[] }>> {
  const path = `/crm/v4/objects/${encodeURIComponent(fromObjectTypeId)}/${encodeURIComponent(fromRecordId)}/associations/${encodeURIComponent(toObjectTypeId)}`;
  return hubspotApiGetJson<{ results?: unknown[] }>(path);
}

function parseAssociatedIds(payload: { results?: unknown[] }): string[] {
  const out: string[] = [];
  const push = (raw: unknown) => {
    if (raw === null || raw === undefined || raw === "") return;
    const s = String(raw).trim();
    if (s && !out.includes(s)) out.push(s);
  };

  for (const row of payload.results ?? []) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    push(r.toObjectId);
    push(r.id);

    const toArr = r.to;
    if (Array.isArray(toArr)) {
      for (const t of toArr) {
        if (!t || typeof t !== "object") continue;
        const o = t as Record<string, unknown>;
        push(o.toObjectId);
        push(o.id);
      }
    }
  }
  return out;
}

export async function hubspotListAssociatedIds(
  fromObjectTypeId: string,
  fromRecordId: string,
  toObjectTypeId: string,
): Promise<{ ok: true; ids: string[] } | { ok: false; message: string }> {
  const res = await hubspotGetAssociatedObjectIds(fromObjectTypeId, fromRecordId, toObjectTypeId);
  if (!res.ok) {
    return { ok: false, message: res.message };
  }
  return { ok: true, ids: parseAssociatedIds(res.data) };
}

/**
 * Batch-create labeled v4 associations (entry ↔ shortlist / entry ↔ candidate).
 * @see https://developers.hubspot.com/docs/api/crm/associations/v4
 */
export async function hubspotBatchCreateAssociationsV4(
  fromObjectTypeId: string,
  toObjectTypeId: string,
  inputs: Array<{
    fromRecordId: string;
    toRecordId: string;
    associationTypeId: number;
    associationCategory?: "USER_DEFINED" | "HUBSPOT_DEFINED";
  }>,
): Promise<HubSpotJsonResult<{ status?: string; results?: unknown[] }>> {
  if (inputs.length === 0) {
    return { ok: true, data: { results: [] } };
  }
  const body = {
    inputs: inputs.map((i) => ({
      from: { id: String(i.fromRecordId) },
      to: { id: String(i.toRecordId) },
      types: [
        {
          associationCategory: i.associationCategory ?? "USER_DEFINED",
          associationTypeId: i.associationTypeId,
        },
      ],
    })),
  };
  const path = `/crm/v4/associations/${encodeURIComponent(fromObjectTypeId)}/${encodeURIComponent(toObjectTypeId)}/batch/create`;
  return hubspotApiSendJson(path, { method: "POST", body });
}

export async function hubspotDeleteCrmObject(
  objectTypeId: string,
  recordId: string,
): Promise<HubSpotJsonResult<void>> {
  const path = `/crm/v3/objects/${encodeURIComponent(objectTypeId)}/${encodeURIComponent(recordId)}`;
  return hubspotApiDelete(path);
}

/**
 * Create USER_DEFINED association using type id from platform mapping (install).
 * `associationTypeId` must resolve to a finite number for HubSpot.
 */
export async function hubspotCreateAssociationV4(
  fromObjectTypeId: string,
  fromRecordId: string,
  toObjectTypeId: string,
  toRecordId: string,
  associationTypeId: string,
): Promise<HubSpotJsonResult<unknown>> {
  const typeNum = Number(String(associationTypeId).trim());
  if (!Number.isFinite(typeNum)) {
    return {
      ok: false,
      status: 400,
      message: `associationTypeId must be numeric (got ${JSON.stringify(associationTypeId)}). Re-run install to refresh mapping.`,
    };
  }
  const body = [{ associationCategory: "USER_DEFINED", associationTypeId: typeNum }];
  const path = `/crm/v4/objects/${encodeURIComponent(fromObjectTypeId)}/${encodeURIComponent(fromRecordId)}/associations/${encodeURIComponent(toObjectTypeId)}/${encodeURIComponent(toRecordId)}`;
  return hubspotApiSendJson(path, { method: "PUT", body });
}
