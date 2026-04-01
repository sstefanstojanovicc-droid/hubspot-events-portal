"use server";

import { revalidatePath } from "next/cache";

import { assertClientAccountAccess, requireSession } from "@/src/lib/auth/guards";
import {
  createCandidate,
  createShortlistEntry,
  saveShortlistBuilderDraft,
  updateCandidate,
  updateShortlist,
  updateShortlistEntry,
} from "@/src/lib/search-board/data";
import type { ShortlistDraftSlotWire } from "@/src/lib/search-board/types";

function pick(
  formData: FormData,
  key: string,
): string {
  return String(formData.get(key) ?? "").trim();
}

async function guardClient(pickClientId: string) {
  const session = await requireSession();
  assertClientAccountAccess(session, pickClientId);
}

export type SearchBoardActionState = { ok: boolean; message: string };

export async function createShortlistEntryAction(
  _prev: SearchBoardActionState | undefined,
  formData: FormData,
): Promise<SearchBoardActionState> {
  const clientId = pick(formData, "clientId");
  const shortlistId = pick(formData, "shortlistId");
  const candidateId = pick(formData, "candidateId");
  const rank = Number(pick(formData, "rank")) || 0;
  const shortlistStatus = pick(formData, "shortlistStatus") || "New";
  const clientFeedback = pick(formData, "clientFeedback") || undefined;
  const internalNotes = pick(formData, "internalNotes") || undefined;

  if (!clientId || !shortlistId || !candidateId) {
    return { ok: false, message: "Shortlist, candidate, and workspace are required." };
  }

  const res = await createShortlistEntry(clientId, {
    shortlistId,
    candidateId,
    rank,
    shortlistStatus,
    clientFeedback,
    internalNotes,
  });

  if (!res.ok) {
    const msg =
      res.error.code === "hubspot"
        ? res.error.message
        : res.error.code === "incomplete_mapping"
          ? res.error.detail
          : "Could not create entry.";
    return { ok: false, message: msg };
  }

  revalidatePath(`/apps/search-board/shortlists/${shortlistId}`);
  revalidatePath("/apps/search-board");
  revalidatePath("/apps/search-board/shortlists");
  return { ok: true, message: "Candidate added to shortlist." };
}

export async function updateShortlistEntryAction(
  _prev: SearchBoardActionState | undefined,
  formData: FormData,
): Promise<SearchBoardActionState> {
  const clientId = pick(formData, "clientId");
  const entryId = pick(formData, "entryId");
  const shortlistId = pick(formData, "shortlistId");

  const rankRaw = pick(formData, "rank");
  const shortlistStatus = pick(formData, "shortlistStatus") || undefined;
  const clientFeedback = pick(formData, "clientFeedback") || undefined;
  const internalNotes = pick(formData, "internalNotes") || undefined;

  if (!clientId || !entryId) {
    return { ok: false, message: "Missing entry context." };
  }

  await guardClient(clientId);

  const props: Record<string, string | number | undefined> = {};
  if (rankRaw !== "") {
    const n = Number(rankRaw);
    if (Number.isFinite(n)) props.rank = n;
  }
  if (shortlistStatus) props.shortlist_status = shortlistStatus;
  if (clientFeedback !== undefined) props.client_feedback = clientFeedback;
  if (internalNotes !== undefined) props.internal_notes = internalNotes;

  const res = await updateShortlistEntry(clientId, entryId, props);
  if (!res.ok) {
    return {
      ok: false,
      message: res.error.code === "hubspot" ? res.error.message : "Update failed.",
    };
  }

  if (shortlistId) {
    revalidatePath(`/apps/search-board/shortlists/${shortlistId}`);
  }
  revalidatePath("/apps/search-board");
  return { ok: true, message: "Entry updated." };
}

export async function updateShortlistAction(
  _prev: SearchBoardActionState | undefined,
  formData: FormData,
): Promise<SearchBoardActionState> {
  const clientId = pick(formData, "clientId");
  const shortlistId = pick(formData, "shortlistId");
  if (!clientId || !shortlistId) {
    return { ok: false, message: "Missing shortlist." };
  }

  await guardClient(clientId);

  const status = pick(formData, "status") || undefined;
  const portalLink = pick(formData, "portal_link") || undefined;
  const internalNotes = pick(formData, "internal_notes") || undefined;

  const props: Record<string, string | undefined> = {};
  if (status !== undefined) props.status = status;
  if (portalLink !== undefined) props.portal_link = portalLink;
  if (internalNotes !== undefined) props.internal_notes = internalNotes;

  const res = await updateShortlist(clientId, shortlistId, props);
  if (!res.ok) {
    return {
      ok: false,
      message: res.error.code === "hubspot" ? res.error.message : "Update failed.",
    };
  }

  revalidatePath(`/apps/search-board/shortlists/${shortlistId}`);
  revalidatePath("/apps/search-board/shortlists");
  return { ok: true, message: "Shortlist updated." };
}

export async function saveShortlistDraftAction(
  _prev: SearchBoardActionState | undefined,
  formData: FormData,
): Promise<SearchBoardActionState> {
  const clientId = pick(formData, "clientId");
  const shortlistId = pick(formData, "shortlistId");
  const draftJson = pick(formData, "draftJson");
  if (!clientId || !shortlistId || !draftJson) {
    return { ok: false, message: "Missing shortlist or draft payload." };
  }

  await guardClient(clientId);

  let slots: (ShortlistDraftSlotWire | null)[];
  try {
    slots = JSON.parse(draftJson) as (ShortlistDraftSlotWire | null)[];
  } catch {
    return { ok: false, message: "Invalid draft JSON." };
  }

  const res = await saveShortlistBuilderDraft(clientId, shortlistId, slots);
  if (!res.ok) {
    const msg =
      res.error.code === "hubspot"
        ? res.error.message
        : res.error.code === "incomplete_mapping"
          ? res.error.detail
          : "Could not save shortlist.";
    return { ok: false, message: msg };
  }

  revalidatePath(`/apps/search-board/shortlists/${shortlistId}`);
  revalidatePath("/apps/search-board");
  revalidatePath("/apps/search-board/shortlists");
  return { ok: true, message: "Shortlist saved to HubSpot." };
}

export async function sendShortlistToClientAction(
  _prev: SearchBoardActionState | undefined,
  formData: FormData,
): Promise<SearchBoardActionState> {
  const clientId = pick(formData, "clientId");
  const shortlistId = pick(formData, "shortlistId");
  if (!clientId || !shortlistId) {
    return { ok: false, message: "Missing shortlist." };
  }

  await guardClient(clientId);

  const res = await updateShortlist(clientId, shortlistId, { status: "Sent to client" });
  if (!res.ok) {
    return {
      ok: false,
      message: res.error.code === "hubspot" ? res.error.message : "Update failed.",
    };
  }

  revalidatePath(`/apps/search-board/shortlists/${shortlistId}`);
  revalidatePath("/apps/search-board/shortlists");
  return { ok: true, message: "Shortlist marked as sent to client." };
}

export async function createCandidateAction(
  _prev: SearchBoardActionState | undefined,
  formData: FormData,
): Promise<SearchBoardActionState> {
  const clientId = pick(formData, "clientId");
  const candidate_name = pick(formData, "candidate_name");
  if (!clientId || !candidate_name) {
    return { ok: false, message: "Name is required." };
  }

  await guardClient(clientId);

  const res = await createCandidate(clientId, {
    candidate_name,
    current_title: pick(formData, "current_title") || undefined,
    summary: pick(formData, "summary") || undefined,
    location: pick(formData, "location") || undefined,
    gender: pick(formData, "gender") || undefined,
    status: pick(formData, "status") || undefined,
  });

  if (!res.ok) {
    return {
      ok: false,
      message: res.error.code === "hubspot" ? res.error.message : "Could not create candidate.",
    };
  }

  revalidatePath("/apps/search-board");
  revalidatePath("/apps/search-board/candidates/" + res.id);
  revalidatePath("/apps/search-board/shortlists");
  return { ok: true, message: res.id };
}

export async function updateCandidateAction(
  _prev: SearchBoardActionState | undefined,
  formData: FormData,
): Promise<SearchBoardActionState> {
  const clientId = pick(formData, "clientId");
  const candidateId = pick(formData, "candidateId");
  if (!clientId || !candidateId) {
    return { ok: false, message: "Missing candidate." };
  }

  await guardClient(clientId);

  const res = await updateCandidate(clientId, candidateId, {
    candidate_name: pick(formData, "candidate_name") || undefined,
    current_title: pick(formData, "current_title") || undefined,
    summary: pick(formData, "summary") || undefined,
    location: pick(formData, "location") || undefined,
    gender: pick(formData, "gender") || undefined,
    status: pick(formData, "status") || undefined,
  });

  if (!res.ok) {
    return {
      ok: false,
      message: res.error.code === "hubspot" ? res.error.message : "Update failed.",
    };
  }

  revalidatePath(`/apps/search-board/candidates/${candidateId}`);
  revalidatePath("/apps/search-board");
  return { ok: true, message: "Candidate saved." };
}
