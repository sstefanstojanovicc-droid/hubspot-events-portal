"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  saveShortlistDraftAction,
  sendShortlistToClientAction,
  updateShortlistAction,
  type SearchBoardActionState,
} from "@/src/lib/platform/actions/search-board-app-actions";
import { SHORTLIST_ENTRY_STATUS_COLUMNS } from "@/src/lib/search-board/constants";
import type {
  CandidateRecord,
  ShortlistBoardItem,
  ShortlistDraftSlotWire,
} from "@/src/lib/search-board/types";
import { CreateCandidateModal } from "@/src/components/search-board/create-candidate-modal";
import { StatusBadge } from "@/src/components/search-board/primitives";

type ShortlistProps = Record<string, string | null | undefined>;

const BUILDER_RANKS = [1, 2, 3, 4, 5] as const;
type RankKey = (typeof BUILDER_RANKS)[number];

const DND_MIME = "application/x-search-board-slot";

type DndPayload = { source: "pool" | "slot"; candidateId: string; rank?: number };

type DraftCell = {
  candidateId: string;
  entryId: string | null;
  shortlistStatus: string;
  clientFeedback: string;
  internalNotes: string;
};

type DraftState = Record<RankKey, DraftCell | null>;

function encodeDnd(p: DndPayload): string {
  return JSON.stringify(p);
}

function parseDnd(raw: string): DndPayload | null {
  try {
    const p = JSON.parse(raw) as DndPayload;
    if (!p?.candidateId || (p.source !== "pool" && p.source !== "slot")) return null;
    return p;
  } catch {
    return null;
  }
}

function cloneDraft(d: DraftState): DraftState {
  const o: DraftState = { 1: null, 2: null, 3: null, 4: null, 5: null };
  for (const r of BUILDER_RANKS) {
    const c = d[r];
    o[r] = c ? { ...c } : null;
  }
  return o;
}

function buildDraftFromItems(items: ShortlistBoardItem[]): DraftState {
  const o: DraftState = { 1: null, 2: null, 3: null, 4: null, 5: null };
  const used = new Set<number>();
  for (const it of items) {
    const rank = it.rank;
    if (rank >= 1 && rank <= 5 && !used.has(rank)) {
      used.add(rank);
      o[rank as RankKey] = {
        candidateId: String(it.candidateId),
        entryId: it.entryId,
        shortlistStatus: it.shortlistStatus,
        clientFeedback: it.clientFeedback ?? "",
        internalNotes: it.internalNotes ?? "",
      };
    }
  }
  return o;
}

function draftToWire(d: DraftState): (ShortlistDraftSlotWire | null)[] {
  return BUILDER_RANKS.map((rank) => {
    const c = d[rank];
    if (!c) return null;
    return {
      rank,
      candidateId: c.candidateId,
      entryId: c.entryId,
      shortlistStatus: c.shortlistStatus,
      clientFeedback: c.clientFeedback,
      internalNotes: c.internalNotes,
    };
  });
}

function serializeDraft(d: DraftState): string {
  return JSON.stringify(draftToWire(d));
}

function applyDropOnRank(draft: DraftState, targetRank: RankKey, payload: DndPayload): DraftState {
  const next = cloneDraft(draft);
  const candId = payload.candidateId;

  if (payload.source === "slot" && payload.rank != null) {
    const fromRank = payload.rank as RankKey;
    const cell = next[fromRank];
    if (!cell || cell.candidateId !== candId) return draft;

    for (const r of BUILDER_RANKS) {
      if (next[r]?.candidateId === candId) next[r] = null;
    }

    if (fromRank === targetRank) {
      next[fromRank] = cell;
      return next;
    }

    next[targetRank] = cell;
    return next;
  }

  let existingCell: DraftCell | undefined;
  for (const r of BUILDER_RANKS) {
    if (next[r]?.candidateId === candId) {
      existingCell = next[r]!;
      next[r] = null;
    }
  }

  next[targetRank] = existingCell ?? {
    candidateId: candId,
    entryId: null,
    shortlistStatus: "New",
    clientFeedback: "",
    internalNotes: "",
  };
  return next;
}

const actionInitial: SearchBoardActionState = { ok: false, message: "" };

export function ShortlistWorkspace({
  clientId,
  shortlistId,
  shortlist,
  items,
  candidates,
}: {
  clientId: string;
  shortlistId: string;
  shortlist: { id: string; properties: ShortlistProps };
  items: ShortlistBoardItem[];
  candidates: CandidateRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const serverSignature = useMemo(
    () =>
      items
        .map(
          (i) =>
            `${i.entryId}|${i.rank}|${i.candidateId}|${i.shortlistStatus}|${i.clientFeedback ?? ""}|${i.internalNotes ?? ""}`,
        )
        .sort()
        .join("§"),
    [items],
  );

  const baselineSerialized = useMemo(
    () => serializeDraft(buildDraftFromItems(items)),
    [serverSignature],
  );

  const [draft, setDraft] = useState<DraftState>(() => buildDraftFromItems(items));
  const dirty = serializeDraft(draft) !== baselineSerialized;

  useEffect(() => {
    setDraft(buildDraftFromItems(items));
  }, [serverSignature]);

  const [nameQ, setNameQ] = useState("");
  const [locFilter, setLocFilter] = useState("");
  const [titleQ, setTitleQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editRank, setEditRank] = useState<RankKey | null>(null);

  const p = shortlist.properties;
  const name = String(p.shortlist_name ?? "Shortlist");
  const clientName = String(p.client_name ?? "");
  const roleTitle = String(p.role_title ?? "");
  const consultant = String(p.consultant_name ?? "");
  const slStatus = String(p.status ?? "");
  const portalLink = String(p.portal_link ?? "");
  const portalExpiry = p.portal_expiry ? String(p.portal_expiry) : "";
  const shortlistInternalNotes = String(p.internal_notes ?? "");

  const candById = useMemo(
    () => new Map(candidates.map((c) => [String(c.id), c] as const)),
    [candidates],
  );

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) {
      const loc = String(c.properties.location ?? "").trim();
      if (loc) set.add(loc);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [candidates]);

  const filteredPool = useMemo(() => {
    const nq = nameQ.trim().toLowerCase();
    const tq = titleQ.trim().toLowerCase();
    const st = statusFilter.trim().toLowerCase();
    return candidates.filter((c) => {
      const pr = c.properties;
      const cn = String(pr.candidate_name ?? "").toLowerCase();
      const title = String(pr.current_title ?? "").toLowerCase();
      const cst = String(pr.status ?? "").toLowerCase();
      if (nq && !cn.includes(nq)) return false;
      if (tq && !title.includes(tq)) return false;
      if (locFilter && String(pr.location ?? "") !== locFilter) return false;
      if (st && !cst.includes(st)) return false;
      return true;
    });
  }, [candidates, nameQ, locFilter, titleQ, statusFilter]);

  const firstEmptyRank = useMemo(() => {
    for (const r of BUILDER_RANKS) {
      if (!draft[r]) return r;
    }
    return undefined;
  }, [draft]);

  const readPayload = useCallback((e: React.DragEvent): DndPayload | null => {
    const mime = e.dataTransfer.getData(DND_MIME);
    if (mime) {
      const parsed = parseDnd(mime);
      if (parsed) return parsed;
    }
    const plain = e.dataTransfer.getData("text/plain");
    if (plain?.startsWith("{")) return parseDnd(plain);
    if (plain) return { source: "pool", candidateId: plain };
    return null;
  }, []);

  const onDragStartPool = useCallback((e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData(DND_MIME, encodeDnd({ source: "pool", candidateId }));
    e.dataTransfer.setData("text/plain", candidateId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragStartSlot = useCallback((e: React.DragEvent, cell: DraftCell, rank: RankKey) => {
    e.dataTransfer.setData(
      DND_MIME,
      encodeDnd({ source: "slot", candidateId: cell.candidateId, rank }),
    );
    e.dataTransfer.setData("text/plain", cell.candidateId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDropSlot = useCallback(
    (e: React.DragEvent, rank: RankKey) => {
      e.preventDefault();
      const payload = readPayload(e);
      if (!payload?.candidateId) return;
      setDraft((prev) => applyDropOnRank(prev, rank, payload));
    },
    [readPayload],
  );

  const onDragOverSlot = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDropPool = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const payload = readPayload(e);
      if (payload?.source !== "slot" || payload.rank == null) return;
      setDraft((prev) => {
        const next = cloneDraft(prev);
        next[payload.rank as RankKey] = null;
        return next;
      });
    },
    [readPayload],
  );

  const clearSlot = useCallback((rank: RankKey) => {
    setDraft((prev) => {
      const next = cloneDraft(prev);
      next[rank] = null;
      return next;
    });
  }, []);

  const addCandidateToFirstEmpty = useCallback(
    (candidateId: string) => {
      if (firstEmptyRank === undefined) return;
      setDraft((prev) =>
        applyDropOnRank(prev, firstEmptyRank, { source: "pool", candidateId }),
      );
    },
    [firstEmptyRank],
  );

  const resetDraft = useCallback(() => {
    setDraft(buildDraftFromItems(items));
  }, [items]);

  const saveDraft = useCallback(() => {
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("shortlistId", shortlistId);
    fd.set("draftJson", JSON.stringify(draftToWire(draft)));
    startTransition(() => {
      void (async () => {
        const res = await saveShortlistDraftAction(undefined, fd);
        if (res.ok) {
          setToast({ ok: true, text: res.message });
          router.refresh();
        } else {
          setToast({ ok: false, text: res.message });
        }
      })();
    });
  }, [clientId, shortlistId, draft, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const editCell = editRank ? draft[editRank] : null;

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-hub">Shortlist</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {clientName ? (
                <span>
                  <span className="text-slate-400">Client</span> {clientName}
                </span>
              ) : null}
              {roleTitle ? (
                <span>
                  <span className="text-slate-400">Role</span> {roleTitle}
                </span>
              ) : null}
              {consultant ? (
                <span>
                  <span className="text-slate-400">Consultant</span> {consultant}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {slStatus ? <StatusBadge label={slStatus} /> : null}
              <span className="text-sm text-slate-500">
                Record <span className="font-mono text-slate-700">{shortlistId}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {portalLink ? (
              <a
                href={portalLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Open portal
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => portalLink && navigator.clipboard.writeText(portalLink)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={!portalLink}
            >
              Copy portal link
            </button>
            <CreateCandidateModal clientId={clientId} label="Create candidate" variant="secondary" />
          </div>
        </div>
        {portalExpiry ? (
          <p className="mt-4 text-xs text-slate-500">
            Portal expiry: <span className="font-medium text-slate-700">{portalExpiry}</span>
          </p>
        ) : null}

        <ShortlistHeaderForm
          clientId={clientId}
          shortlistId={shortlistId}
          initialStatus={slStatus}
          initialPortalLink={portalLink}
        />
      </header>

      <div
        className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
          dirty ? "border-amber-200 bg-amber-50/80" : "border-slate-200 bg-slate-50/60"
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-slate-900">Ranked shortlist draft</p>
          <p className="text-xs text-slate-600">
            {dirty
              ? "You have unsaved changes. Save to sync ranks, entry names, and line-item fields to HubSpot."
              : "Draft matches the last saved HubSpot state."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetDraft}
            disabled={!dirty || pending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Cancel / Reset
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!dirty || pending}
            className="rounded-lg bg-hub px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save shortlist"}
          </button>
        </div>
      </div>

      {toast ? (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${toast.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}
        >
          {toast.text}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section
          className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:min-h-[520px] ${pending ? "opacity-70" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={onDropPool}
        >
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Candidate pool</h2>
              <p className="mt-1 text-xs text-slate-500">
                Drag into a rank or use Add. Drag a rank card back here to remove from the shortlist
                draft.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Search name
              <input
                value={nameQ}
                onChange={(e) => setNameQ(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                placeholder="Name contains…"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Location
              <select
                value={locFilter}
                onChange={(e) => setLocFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                <option value="">All locations</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Current title
              <input
                value={titleQ}
                onChange={(e) => setTitleQ(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                placeholder="Title contains…"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Candidate status
              <input
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                placeholder="Status contains…"
              />
            </label>
          </div>

          <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-100">
            {filteredPool.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">No candidates match these filters.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Candidate</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPool.map((c) => {
                    const pr = c.properties;
                    const cn = String(pr.candidate_name ?? "—");
                    const id = String(c.id);
                    const onShortlist = BUILDER_RANKS.some((r) => draft[r]?.candidateId === id);
                    return (
                      <tr key={id} className="bg-white hover:bg-slate-50/80">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            draggable
                            onDragStart={(e) => onDragStartPool(e, id)}
                            className="cursor-grab text-left font-medium text-slate-900 active:cursor-grabbing"
                          >
                            {cn}
                          </button>
                          <p className="font-mono text-[10px] text-slate-400">{id}</p>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{String(pr.current_title ?? "—")}</td>
                        <td className="px-3 py-2 text-slate-600">{String(pr.location ?? "—")}</td>
                        <td className="px-3 py-2 text-slate-600">{String(pr.status ?? "—")}</td>
                        <td className="px-3 py-2">
                          {onShortlist ? (
                            <span className="text-xs text-slate-400">On list</span>
                          ) : (
                            <button
                              type="button"
                              disabled={firstEmptyRank === undefined}
                              onClick={() => addCandidateToFirstEmpty(id)}
                              className="text-xs font-semibold text-hub-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Add
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className={`space-y-4 ${pending ? "opacity-70" : ""}`}>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Ranked shortlist (top 5)</h2>
            <p className="mt-1 text-xs text-slate-500">
              One candidate per rank in the draft. Replacing a rank drops the previous person from
              these five slots until you save.
            </p>
          </div>
          <div className="flex flex-col !space-y-3">
            {BUILDER_RANKS.map((rank) => {
              const cell = draft[rank];
              const c = cell ? candById.get(cell.candidateId) : undefined;
              const displayName = c
                ? String(c.properties.candidate_name ?? "—")
                : cell
                  ? "Unknown candidate"
                  : "";
              const displayTitle = c ? String(c.properties.current_title ?? "—") : "";
              const displayLoc = c ? String(c.properties.location ?? "—") : "";
              const displayCandStatus = c ? String(c.properties.status ?? "—") : "";

              return (
                <div
                  key={rank}
                  onDragOver={onDragOverSlot}
                  onDrop={(e) => onDropSlot(e, rank)}
                  className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 transition-colors hover:border-hub-muted"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Rank {rank}
                    </span>
                    {cell ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditRank(rank)}
                          className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white"
                        >
                          Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => clearSlot(rank)}
                          className="rounded-md px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {cell ? (
                    <div
                      draggable
                      onDragStart={(e) => onDragStartSlot(e, cell, rank)}
                      className="mt-3 cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/apps/search-board/candidates/${cell.candidateId}`}
                            className="font-semibold text-hub-ink hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {displayName}
                          </Link>
                          <p className="font-mono text-[10px] text-slate-400">
                            {cell.entryId ? `Entry ${cell.entryId}` : "New (unsaved)"} ·{" "}
                            {cell.candidateId}
                          </p>
                        </div>
                        <StatusBadge label={cell.shortlistStatus || "New"} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{displayTitle || "—"}</p>
                      <p className="text-xs text-slate-500">{displayLoc || "—"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Cand. status: {displayCandStatus || "—"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-6 text-center text-sm text-slate-400">Drop a candidate here</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
        <h2 className="text-sm font-semibold text-slate-900">Shortlist</h2>
        <ShortlistNotesAndSendForm
          clientId={clientId}
          shortlistId={shortlistId}
          initialInternalNotes={shortlistInternalNotes}
        />
      </section>

      {editRank != null && editCell ? (
        <DraftEntryEditModal
          key={`${editRank}-${editCell.candidateId}`}
          rank={editRank}
          cell={editCell}
          candidateLabel={
            candById.get(editCell.candidateId)
              ? String(candById.get(editCell.candidateId)!.properties.candidate_name ?? "")
              : editCell.candidateId
          }
          onClose={() => setEditRank(null)}
          onApply={(patch) => {
            setDraft((prev) => {
              const next = cloneDraft(prev);
              const cur = next[editRank];
              if (!cur) return prev;
              next[editRank] = { ...cur, ...patch };
              return next;
            });
            setEditRank(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ShortlistHeaderForm({
  clientId,
  shortlistId,
  initialStatus,
  initialPortalLink,
}: {
  clientId: string;
  shortlistId: string;
  initialStatus: string;
  initialPortalLink: string;
}) {
  const [state, action] = useActionState(updateShortlistAction, actionInitial);
  return (
    <form
      action={action}
      className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="shortlistId" value={shortlistId} />
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Shortlist status
        <input
          name="status"
          defaultValue={initialStatus}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex min-w-[200px] flex-col gap-1 text-xs font-medium text-slate-600">
        Portal link
        <input
          name="portal_link"
          defaultValue={initialPortalLink}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          placeholder="https://…"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Save header
      </button>
      {state.message ? (
        <p className={`text-xs ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function ShortlistNotesAndSendForm({
  clientId,
  shortlistId,
  initialInternalNotes,
}: {
  clientId: string;
  shortlistId: string;
  initialInternalNotes: string;
}) {
  const router = useRouter();
  const [notesState, notesAction] = useActionState(updateShortlistAction, actionInitial);
  const [sendState, sendAction] = useActionState(sendShortlistToClientAction, actionInitial);

  useEffect(() => {
    if (notesState.ok && notesState.message) router.refresh();
  }, [notesState.ok, notesState.message, router]);

  useEffect(() => {
    if (sendState.ok && sendState.message) router.refresh();
  }, [sendState.ok, sendState.message, router]);

  return (
    <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
      <form action={notesAction} className="min-w-0 flex-1 space-y-3">
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="shortlistId" value={shortlistId} />
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Internal notes (shortlist)
          <textarea
            name="internal_notes"
            rows={4}
            defaultValue={initialInternalNotes}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Consultant-only notes for this search / client…"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Save notes
        </button>
        {notesState.message ? (
          <p className={`text-xs ${notesState.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {notesState.message}
          </p>
        ) : null}
      </form>
      <form action={sendAction} className="shrink-0">
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="shortlistId" value={shortlistId} />
        <button
          type="submit"
          className="rounded-lg bg-hub px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
        >
          Send shortlist to client
        </button>
        {sendState.message ? (
          <p className={`mt-2 text-xs ${sendState.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {sendState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function DraftEntryEditModal({
  rank,
  cell,
  candidateLabel,
  onClose,
  onApply,
}: {
  rank: RankKey;
  cell: DraftCell;
  candidateLabel: string;
  onClose: () => void;
  onApply: (
    patch: Pick<DraftCell, "shortlistStatus" | "clientFeedback" | "internalNotes">,
  ) => void;
}) {
  const [shortlistStatus, setShortlistStatus] = useState(cell.shortlistStatus);
  const [clientFeedback, setClientFeedback] = useState(cell.clientFeedback);
  const [internalNotes, setInternalNotes] = useState(cell.internalNotes);

  const statusOptions = useMemo(() => {
    const base = [...SHORTLIST_ENTRY_STATUS_COLUMNS];
    const cur = shortlistStatus?.trim();
    if (cur && !base.some((b) => b.toLowerCase() === cur.toLowerCase())) {
      return [cur, ...base];
    }
    return base;
  }, [shortlistStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Shortlist entry (draft)</h2>
            <p className="text-sm text-slate-600">{candidateLabel}</p>
            <p className="text-xs text-slate-500">Rank {rank} · saved on &quot;Save shortlist&quot;</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Shortlist status
            <select
              value={shortlistStatus}
              onChange={(e) => setShortlistStatus(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            >
              {statusOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Client feedback
            <textarea
              value={clientFeedback}
              onChange={(e) => setClientFeedback(e.target.value)}
              rows={3}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Internal notes (entry)
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                onApply({ shortlistStatus, clientFeedback, internalNotes })
              }
              className="flex-1 rounded-lg bg-hub py-2 text-sm font-semibold text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
