import "server-only";

import { getClientAppMapping } from "@/src/lib/platform/client-app-mapping-store";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import { REVIEW_FUNNEL_STATUS_FRAGMENTS, normalizeEntryStatus } from "@/src/lib/search-board/constants";
import {
  hubspotBatchCreateAssociationsV4,
  hubspotBatchReadObjects,
  hubspotCreateAssociationV4,
  hubspotCreateCrmObject,
  hubspotDeleteCrmObject,
  hubspotFetchAllObjectPages,
  hubspotGetCrmObject,
  hubspotListAssociatedIds,
  hubspotPatchCrmObject,
  type HubSpotCrmObjectRow,
} from "@/src/lib/search-board/hubspot-crm";
import type {
  CandidateRecord,
  SearchBoardTenantObjects,
  ShortlistBoardItem,
  ShortlistDraftSlotWire,
  ShortlistEntryRecord,
  ShortlistRecord,
} from "@/src/lib/search-board/types";

const SHORTLIST_PROPS = [
  "shortlist_name",
  "client_name",
  "role_title",
  "consultant_name",
  "status",
  "portal_link",
  "portal_expiry",
  "internal_notes",
  "hs_lastmodifieddate",
] as const;

const CANDIDATE_PROPS = [
  "candidate_name",
  "current_title",
  "summary",
  "location",
  "gender",
  "status",
  "hs_lastmodifieddate",
] as const;

const ENTRY_PROPS = [
  "rank",
  "shortlist_status",
  "client_feedback",
  "internal_notes",
  "entry_name",
  "hs_lastmodifieddate",
] as const;

export type SearchBoardDataError =
  | { code: "no_token" }
  | { code: "no_mapping" }
  | { code: "incomplete_mapping"; detail: string }
  | { code: "hubspot"; message: string };

export function getSearchBoardTenantObjects(clientId: string):
  | { ok: true; tenant: SearchBoardTenantObjects }
  | { ok: false; error: SearchBoardDataError } {
  if (!isHubSpotAccessTokenConfigured()) {
    return { ok: false, error: { code: "no_token" } };
  }
  const mapping = getClientAppMapping(clientId, "search_board");
  if (!mapping) {
    return { ok: false, error: { code: "no_mapping" } };
  }

  const c = mapping.hubspot.objects.candidate?.objectTypeId?.trim();
  const s = mapping.hubspot.objects.shortlist?.objectTypeId?.trim();
  const e = mapping.hubspot.objects.shortlist_entry?.objectTypeId?.trim();
  if (!c || !s || !e) {
    return {
      ok: false,
      error: {
        code: "incomplete_mapping",
        detail: "Run Search Board install for this tenant to resolve object type IDs.",
      },
    };
  }

  return {
    ok: true,
    tenant: {
      clientId,
      candidateTypeId: c,
      shortlistTypeId: s,
      entryTypeId: e,
      associationEntryToShortlistTypeId:
        mapping.hubspot.associationTypeIds.entry_shortlist?.trim(),
      associationEntryToCandidateTypeId:
        mapping.hubspot.associationTypeIds.entry_candidate?.trim(),
    },
  };
}

function rowToShortlist(r: HubSpotCrmObjectRow): ShortlistRecord {
  return { id: r.id, properties: r.properties };
}

function rowToCandidate(r: HubSpotCrmObjectRow): CandidateRecord {
  return { id: r.id, properties: r.properties };
}

function rowToEntry(r: HubSpotCrmObjectRow): ShortlistEntryRecord {
  return { id: r.id, properties: r.properties };
}

export async function listShortlists(
  clientId: string,
): Promise<{ ok: true; shortlists: ShortlistRecord[] } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotFetchAllObjectPages(t.tenant.shortlistTypeId, [...SHORTLIST_PROPS]);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true, shortlists: res.rows.map(rowToShortlist) };
}

export async function getShortlistById(
  clientId: string,
  id: string,
): Promise<{ ok: true; shortlist: ShortlistRecord } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotGetCrmObject(t.tenant.shortlistTypeId, id, [...SHORTLIST_PROPS]);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true, shortlist: rowToShortlist(res.data) };
}

export async function listCandidates(
  clientId: string,
): Promise<{ ok: true; candidates: CandidateRecord[] } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotFetchAllObjectPages(t.tenant.candidateTypeId, [...CANDIDATE_PROPS]);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true, candidates: res.rows.map(rowToCandidate) };
}

export async function getCandidateById(
  clientId: string,
  id: string,
): Promise<{ ok: true; candidate: CandidateRecord } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotGetCrmObject(t.tenant.candidateTypeId, id, [...CANDIDATE_PROPS]);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true, candidate: rowToCandidate(res.data) };
}

export async function listShortlistEntryIdsForShortlist(
  clientId: string,
  shortlistId: string,
): Promise<{ ok: true; entryIds: string[] } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;

  const fromShortlist = await hubspotListAssociatedIds(
    t.tenant.shortlistTypeId,
    shortlistId,
    t.tenant.entryTypeId,
  );
  if (!fromShortlist.ok) {
    return { ok: false, error: { code: "hubspot", message: fromShortlist.message } };
  }
  if (fromShortlist.ids.length > 0) {
    return { ok: true, entryIds: fromShortlist.ids };
  }

  /** HubSpot sometimes surfaces associations only from the entry side — scan entries (capped). */
  const scan = await hubspotFetchAllObjectPages(t.tenant.entryTypeId, ["hs_object_id"], {
    maxPages: 12,
    pageSize: 50,
  });
  if (!scan.ok) {
    return { ok: true, entryIds: [] };
  }
  const matched: string[] = [];
  await Promise.all(
    scan.rows.map(async (row) => {
      const s = await hubspotListAssociatedIds(
        t.tenant.entryTypeId,
        row.id,
        t.tenant.shortlistTypeId,
      );
      if (s.ok && s.ids.some((id) => String(id) === String(shortlistId))) {
        matched.push(row.id);
      }
    }),
  );
  return { ok: true, entryIds: matched };
}

/**
 * Resolves shortlist → shortlist_entry records → linked candidate (see loadShortlistBoardData).
 */
export async function listShortlistEntries(
  clientId: string,
  shortlistId: string,
): Promise<
  | { ok: true; shortlist: ShortlistRecord; items: ShortlistBoardItem[] }
  | { ok: false; error: SearchBoardDataError }
> {
  return loadShortlistBoardData(clientId, shortlistId);
}

export async function loadShortlistBoardData(
  clientId: string,
  shortlistId: string,
): Promise<
  | {
      ok: true;
      shortlist: ShortlistRecord;
      items: ShortlistBoardItem[];
    }
  | { ok: false; error: SearchBoardDataError }
> {
  const shortlistRes = await getShortlistById(clientId, shortlistId);
  if (!shortlistRes.ok) {
    return shortlistRes;
  }

  const entriesRes = await listShortlistEntryIdsForShortlist(clientId, shortlistId);
  if (!entriesRes.ok) {
    return entriesRes;
  }

  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) {
    return t;
  }

  const batch = await hubspotBatchReadObjects(
    t.tenant.entryTypeId,
    entriesRes.entryIds,
    [...ENTRY_PROPS],
  );
  if (!batch.ok) {
    return { ok: false, error: { code: "hubspot", message: batch.message } };
  }

  const entryRows = batch.data.results ?? [];
  const entries = entryRows.map(rowToEntry);

  const candLinks = await Promise.all(
    entryRows.map(async (row) => {
      const candAssoc = await hubspotListAssociatedIds(
        t.tenant.entryTypeId,
        row.id,
        t.tenant.candidateTypeId,
      );
      const candidateId = candAssoc.ok ? candAssoc.ids[0] ?? "" : "";
      return { entryId: row.id, candidateId };
    }),
  );
  const entryToCandidate = new Map(candLinks.map((c) => [c.entryId, c.candidateId] as const));

  const candidateIds = new Set<string>();
  for (const c of candLinks) {
    if (c.candidateId) {
      candidateIds.add(c.candidateId);
    }
  }

  const candBatch = await hubspotBatchReadObjects(
    t.tenant.candidateTypeId,
    [...candidateIds],
    [...CANDIDATE_PROPS],
  );
  if (!candBatch.ok) {
    return { ok: false, error: { code: "hubspot", message: candBatch.message } };
  }

  const candById = new Map(
    (candBatch.data.results ?? []).map((r) => [r.id, rowToCandidate(r)] as const),
  );

  const items: ShortlistBoardItem[] = [];
  for (const e of entries) {
    const candidateId = entryToCandidate.get(e.id) ?? "";
    const cand = candidateId ? candById.get(candidateId) : undefined;
    const rankRaw = e.properties.rank;
    const rank = rankRaw != null && rankRaw !== "" ? Number(rankRaw) : 0;
    const notes = e.properties.internal_notes ?? "";
    const feedbackFull = String(e.properties.client_feedback ?? "");
    items.push({
      entryId: e.id,
      candidateId,
      rank: Number.isFinite(rank) ? rank : 0,
      entryName: String(e.properties.entry_name ?? ""),
      shortlistStatus: normalizeEntryStatus(e.properties.shortlist_status as string | undefined),
      candidateName: (cand?.properties.candidate_name as string) ?? "Unknown candidate",
      currentTitle: (cand?.properties.current_title as string) ?? "",
      location: (cand?.properties.location as string) ?? "",
      candidateStatus: (cand?.properties.status as string) ?? "",
      summaryPreview: truncate((cand?.properties.summary as string) ?? "", 120),
      clientFeedbackPreview: truncate(feedbackFull, 80),
      clientFeedback: feedbackFull,
      internalNotes: String(e.properties.internal_notes ?? ""),
      hasInternalNotes: Boolean(notes && String(notes).trim().length > 0),
      lastModified: (e.properties.hs_lastmodifieddate as string) ?? undefined,
    });
  }

  items.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return (a.candidateName || "").localeCompare(b.candidateName || "");
  });

  return { ok: true, shortlist: shortlistRes.shortlist, items };
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

export async function createCandidate(
  clientId: string,
  properties: Record<string, string | undefined>,
): Promise<{ ok: true; id: string } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotCreateCrmObject(t.tenant.candidateTypeId, properties);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true, id: res.data.id };
}

export async function updateCandidate(
  clientId: string,
  candidateId: string,
  properties: Record<string, string | undefined>,
): Promise<{ ok: true } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotPatchCrmObject(t.tenant.candidateTypeId, candidateId, properties);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true };
}

export async function updateShortlist(
  clientId: string,
  shortlistId: string,
  properties: Record<string, string | undefined>,
): Promise<{ ok: true } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotPatchCrmObject(t.tenant.shortlistTypeId, shortlistId, properties);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true };
}

export async function updateShortlistEntry(
  clientId: string,
  entryId: string,
  properties: Record<string, string | number | undefined>,
): Promise<{ ok: true } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotPatchCrmObject(t.tenant.entryTypeId, entryId, properties);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true };
}

export async function createShortlistEntry(
  clientId: string,
  args: {
    shortlistId: string;
    candidateId: string;
    rank: number;
    shortlistStatus: string;
    clientFeedback?: string;
    internalNotes?: string;
    entry_name?: string;
  },
): Promise<{ ok: true; entryId: string } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const tenant = t.tenant;

  const { associationEntryToShortlistTypeId, associationEntryToCandidateTypeId } = tenant;
  if (!associationEntryToShortlistTypeId || !associationEntryToCandidateTypeId) {
    return {
      ok: false,
      error: {
        code: "incomplete_mapping",
        detail:
          "Association type IDs missing in mapping. Re-run Search Board install to capture associations.",
      },
    };
  }

  const create = await hubspotCreateCrmObject(tenant.entryTypeId, {
    rank: args.rank,
    shortlist_status: args.shortlistStatus,
    client_feedback: args.clientFeedback,
    internal_notes: args.internalNotes,
    entry_name: args.entry_name,
  });
  if (!create.ok) {
    return { ok: false, error: { code: "hubspot", message: create.message } };
  }

  const entryId = String(create.data.id).trim();
  const typeSl = Number(String(associationEntryToShortlistTypeId).trim());
  const typeCand = Number(String(associationEntryToCandidateTypeId).trim());
  if (!Number.isFinite(typeSl) || !Number.isFinite(typeCand)) {
    return {
      ok: false,
      error: {
        code: "incomplete_mapping",
        detail:
          "Association type IDs in mapping must be numeric HubSpot type ids. Re-run Search Board install.",
      },
    };
  }

  async function linkShortlist(): Promise<{ ok: false; message: string } | { ok: true }> {
    const batch = await hubspotBatchCreateAssociationsV4(tenant.entryTypeId, tenant.shortlistTypeId, [
      { fromRecordId: entryId, toRecordId: args.shortlistId, associationTypeId: typeSl },
    ]);
    if (batch.ok) return { ok: true };
    const put = await hubspotCreateAssociationV4(
      tenant.entryTypeId,
      entryId,
      tenant.shortlistTypeId,
      args.shortlistId,
      String(typeSl),
    );
    return put.ok ? { ok: true } : { ok: false, message: `Shortlist link failed (batch: ${batch.message}, PUT: ${put.message})` };
  }

  async function linkCandidate(): Promise<{ ok: false; message: string } | { ok: true }> {
    const batch = await hubspotBatchCreateAssociationsV4(tenant.entryTypeId, tenant.candidateTypeId, [
      { fromRecordId: entryId, toRecordId: args.candidateId, associationTypeId: typeCand },
    ]);
    if (batch.ok) return { ok: true };
    const put = await hubspotCreateAssociationV4(
      tenant.entryTypeId,
      entryId,
      tenant.candidateTypeId,
      args.candidateId,
      String(typeCand),
    );
    return put.ok ? { ok: true } : { ok: false, message: `Candidate link failed (batch: ${batch.message}, PUT: ${put.message})` };
  }

  const ls = await linkShortlist();
  if (!ls.ok) {
    return { ok: false, error: { code: "hubspot", message: `Entry ${entryId} created but ${ls.message}` } };
  }
  const lc = await linkCandidate();
  if (!lc.ok) {
    return { ok: false, error: { code: "hubspot", message: `Entry ${entryId} created but ${lc.message}` } };
  }

  return { ok: true, entryId };
}

export async function deleteShortlistEntry(
  clientId: string,
  entryId: string,
): Promise<{ ok: true } | { ok: false; error: SearchBoardDataError }> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) return t;
  const res = await hubspotDeleteCrmObject(t.tenant.entryTypeId, entryId);
  if (!res.ok) {
    return { ok: false, error: { code: "hubspot", message: res.message } };
  }
  return { ok: true };
}

const BUILDER_SLOT_COUNT = 5;

/**
 * Applies ranked builder draft to HubSpot: deletes removed line items, dedupes by candidate,
 * creates or updates entries (rank 1–5, entry_name, status, notes).
 */
export async function saveShortlistBuilderDraft(
  clientId: string,
  shortlistId: string,
  slots: (ShortlistDraftSlotWire | null)[],
): Promise<{ ok: true } | { ok: false; error: SearchBoardDataError }> {
  const sid = String(shortlistId).trim();
  if (!sid) {
    return { ok: false, error: { code: "hubspot", message: "Shortlist id is required." } };
  }
  if (slots.length !== BUILDER_SLOT_COUNT) {
    return {
      ok: false,
      error: { code: "hubspot", message: "Draft must contain exactly five slots (use null for empty)." },
    };
  }

  const desired = new Map<string, ShortlistDraftSlotWire>();
  for (let i = 0; i < BUILDER_SLOT_COUNT; i++) {
    const rank = i + 1;
    const s = slots[i];
    if (!s) continue;
    if (Number(s.rank) !== rank) {
      return {
        ok: false,
        error: { code: "hubspot", message: `Slot ${i} must use rank ${rank}.` },
      };
    }
    const cid = String(s.candidateId ?? "").trim();
    if (!cid) {
      return { ok: false, error: { code: "hubspot", message: "Each filled slot needs a candidate id." } };
    }
    if (desired.has(cid)) {
      return {
        ok: false,
        error: { code: "hubspot", message: "The same candidate cannot appear twice on this shortlist." },
      };
    }
    desired.set(cid, {
      rank,
      candidateId: cid,
      entryId: s.entryId ? String(s.entryId).trim() : null,
      shortlistStatus: String(s.shortlistStatus ?? "New").trim() || "New",
      clientFeedback: String(s.clientFeedback ?? ""),
      internalNotes: String(s.internalNotes ?? ""),
    });
  }

  let board = await loadShortlistBoardData(clientId, sid);
  if (!board.ok) return board;

  for (const it of [...board.items]) {
    if (!desired.has(String(it.candidateId))) {
      const del = await deleteShortlistEntry(clientId, it.entryId);
      if (!del.ok) return del;
    }
  }

  board = await loadShortlistBoardData(clientId, sid);
  if (!board.ok) return board;

  for (const candId of desired.keys()) {
    const rows = board.items.filter((i) => String(i.candidateId) === candId);
    if (rows.length <= 1) continue;
    const spec = desired.get(candId)!;
    const keep =
      spec.entryId && rows.some((r) => r.entryId === spec.entryId)
        ? spec.entryId
        : rows[0]!.entryId;
    for (const row of rows) {
      if (row.entryId !== keep) {
        const del = await deleteShortlistEntry(clientId, row.entryId);
        if (!del.ok) return del;
      }
    }
  }

  board = await loadShortlistBoardData(clientId, sid);
  if (!board.ok) return board;

  for (let i = 0; i < BUILDER_SLOT_COUNT; i++) {
    const rank = i + 1;
    const spec = slots[i];
    if (!spec) continue;
    const candId = String(spec.candidateId).trim();
    const existing = board.items.find((i) => String(i.candidateId) === candId);

    let candName = existing?.candidateName ?? "";
    if (!candName || candName === "Unknown candidate") {
      const g = await getCandidateById(clientId, candId);
      if (g.ok) {
        candName = String(g.candidate.properties.candidate_name ?? "").trim() || "Candidate";
      } else {
        candName = "Candidate";
      }
    }

    const entry_name = `Rank ${rank} · ${candName}`.slice(0, 512);
    const d = desired.get(candId)!;

    if (!existing) {
      const cr = await createShortlistEntry(clientId, {
        shortlistId: sid,
        candidateId: candId,
        rank,
        shortlistStatus: d.shortlistStatus,
        clientFeedback: d.clientFeedback.trim() || undefined,
        internalNotes: d.internalNotes.trim() || undefined,
        entry_name,
      });
      if (!cr.ok) return cr;
    } else {
      const up = await updateShortlistEntry(clientId, existing.entryId, {
        rank,
        shortlist_status: d.shortlistStatus,
        client_feedback: d.clientFeedback,
        internal_notes: d.internalNotes,
        entry_name,
      });
      if (!up.ok) return up;
    }
  }

  return { ok: true };
}

/** For candidate profile: entries involving this candidate, plus shortlist names. */
export async function listCandidateShortlistMemberships(
  clientId: string,
  candidateId: string,
): Promise<
  | {
      ok: true;
      rows: Array<{ entry: ShortlistEntryRecord; shortlist: ShortlistRecord }>;
    }
  | { ok: false; error: SearchBoardDataError }
> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) {
    return t;
  }

  const entryIdsRes = await hubspotListAssociatedIds(
    t.tenant.candidateTypeId,
    candidateId,
    t.tenant.entryTypeId,
  );
  if (!entryIdsRes.ok) {
    return { ok: false, error: { code: "hubspot", message: entryIdsRes.message } };
  }

  if (entryIdsRes.ids.length === 0) {
    return { ok: true, rows: [] };
  }

  const entriesBatch = await hubspotBatchReadObjects(
    t.tenant.entryTypeId,
    entryIdsRes.ids,
    [...ENTRY_PROPS],
  );
  if (!entriesBatch.ok) {
    return { ok: false, error: { code: "hubspot", message: entriesBatch.message } };
  }

  const entries = (entriesBatch.data.results ?? []).map(rowToEntry);
  const shortlistIds = new Set<string>();
  for (const e of entries) {
    const s = await hubspotListAssociatedIds(
      t.tenant.entryTypeId,
      e.id,
      t.tenant.shortlistTypeId,
    );
    if (s.ok && s.ids[0]) {
      shortlistIds.add(s.ids[0]);
    }
  }

  const slBatch = await hubspotBatchReadObjects(
    t.tenant.shortlistTypeId,
    [...shortlistIds],
    [...SHORTLIST_PROPS],
  );
  if (!slBatch.ok) {
    return { ok: false, error: { code: "hubspot", message: slBatch.message } };
  }
  const slById = new Map(
    (slBatch.data.results ?? []).map((r) => [r.id, rowToShortlist(r)] as const),
  );

  const rows: Array<{ entry: ShortlistEntryRecord; shortlist: ShortlistRecord }> = [];
  for (const e of entries) {
    const sidRes = await hubspotListAssociatedIds(
      t.tenant.entryTypeId,
      e.id,
      t.tenant.shortlistTypeId,
    );
    const sid = sidRes.ok ? sidRes.ids[0] : undefined;
    const sl = sid ? slById.get(sid) : undefined;
    if (sl) {
      rows.push({ entry: e, shortlist: sl });
    }
  }

  return { ok: true, rows };
}

/** Approximate entry counts per shortlist HubSpot id (scans entries, capped). */
export async function buildShortlistEntryCounts(
  clientId: string,
): Promise<Record<string, number>> {
  const t = getSearchBoardTenantObjects(clientId);
  if (!t.ok) {
    return {};
  }
  const entries = await hubspotFetchAllObjectPages(t.tenant.entryTypeId, ["hs_object_id"], {
    maxPages: 25,
    pageSize: 80,
  });
  if (!entries.ok) {
    return {};
  }
  const counts: Record<string, number> = {};
  await Promise.all(
    entries.rows.map(async (row) => {
      const s = await hubspotListAssociatedIds(
        t.tenant.entryTypeId,
        row.id,
        t.tenant.shortlistTypeId,
      );
      const sid = s.ok ? s.ids[0] : undefined;
      if (!sid) return;
      counts[sid] = (counts[sid] ?? 0) + 1;
    }),
  );
  return counts;
}

export async function loadDashboardStats(clientId: string): Promise<
  | {
      ok: true;
      activeShortlists: number;
      totalCandidates: number;
      candidatesInReview: number;
      shortlistsExpiringSoon: number;
      recentShortlists: ShortlistRecord[];
    }
  | { ok: false; error: SearchBoardDataError }
> {
  const [sl, cand, entries] = await Promise.all([
    listShortlists(clientId),
    listCandidates(clientId),
    (async () => {
      const t = getSearchBoardTenantObjects(clientId);
      if (!t.ok) return t;
      const res = await hubspotFetchAllObjectPages(t.tenant.entryTypeId, [
        "shortlist_status",
        "hs_lastmodifieddate",
      ]);
      if (!res.ok) {
        return { ok: false as const, error: { code: "hubspot" as const, message: res.message } };
      }
      return { ok: true as const, rows: res.rows };
    })(),
  ]);

  if (!sl.ok) return sl;
  if (!cand.ok) return cand;
  if (!entries.ok) return entries;

  const now = Date.now();
  const soonMs = 14 * 24 * 60 * 60 * 1000;
  const shortlistsExpiringSoon = sl.shortlists.filter((s) => {
    const exp = s.properties.portal_expiry;
    if (!exp) return false;
    const t = new Date(String(exp)).getTime();
    if (!Number.isFinite(t)) return false;
    return t >= now && t <= now + soonMs;
  }).length;

  let candidatesInReview = 0;
  for (const row of entries.rows) {
    const st = String(row.properties.shortlist_status ?? "").toLowerCase();
    if (REVIEW_FUNNEL_STATUS_FRAGMENTS.some((f) => st.includes(f))) {
      candidatesInReview++;
    }
  }

  const recentShortlists = [...sl.shortlists]
    .sort((a, b) => {
      const ta = new Date(String(a.properties.hs_lastmodifieddate ?? 0)).getTime();
      const tb = new Date(String(b.properties.hs_lastmodifieddate ?? 0)).getTime();
      return tb - ta;
    })
    .slice(0, 8);

  return {
    ok: true,
    activeShortlists: sl.shortlists.length,
    totalCandidates: cand.candidates.length,
    candidatesInReview,
    shortlistsExpiringSoon,
    recentShortlists,
  };
}
