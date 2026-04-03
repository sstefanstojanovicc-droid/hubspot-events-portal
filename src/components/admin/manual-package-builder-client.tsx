"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";

import { HUBSPOT_MANUAL_PACKAGE_RESOURCE_TYPES } from "@/src/lib/packages/hubspot-resource-types";
import {
  publishManualPackageDraftAction,
  saveManualPackageDraftAction,
} from "@/src/lib/platform/actions/manual-package-draft";
import type { ManualPackageItem } from "@/src/lib/platform/manual-package-draft-repo";

type DraftRow = {
  id: string;
  name: string;
  sourceHubspotPortalId: string;
  itemsJson: string;
};

export function ManualPackageBuilderClient({
  initialDrafts,
}: {
  initialDrafts: DraftRow[];
}) {
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("Untitled package");
  const [portalId, setPortalId] = useState("");
  const [items, setItems] = useState<ManualPackageItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>(HUBSPOT_MANUAL_PACKAGE_RESOURCE_TYPES[0]);
  const [itemNotes, setItemNotes] = useState("");
  const [filterType, setFilterType] = useState<string | "all">("all");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pendingSave, startSave] = useTransition();
  const [pendingPublish, startPublish] = useTransition();

  const filteredTypes = useMemo(() => {
    const list = [...HUBSPOT_MANUAL_PACKAGE_RESOURCE_TYPES];
    if (filterType === "all") return list;
    return list.filter((t) => t === filterType);
  }, [filterType]);

  const addItem = useCallback(() => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        resourceType: selectedType,
        displayLabel: selectedType,
        notes: itemNotes.trim() || undefined,
      },
    ]);
    setItemNotes("");
    setMessage(null);
  }, [selectedType, itemNotes]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const loadDraft = useCallback((d: DraftRow) => {
    setDraftId(d.id);
    setName(d.name);
    setPortalId(d.sourceHubspotPortalId);
    try {
      const parsed = JSON.parse(d.itemsJson) as ManualPackageItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
    setMessage({ kind: "ok", text: "Draft loaded into builder." });
  }, []);

  function handleSaveDraft() {
    setMessage(null);
    startSave(async () => {
      const fd = new FormData();
      if (draftId) fd.set("draftId", draftId);
      fd.set("name", name);
      fd.set("sourceHubspotPortalId", portalId);
      fd.set("itemsJson", JSON.stringify(items));
      const res = await saveManualPackageDraftAction(undefined, fd);
      if (!res.ok) {
        setMessage({ kind: "err", text: res.message });
        return;
      }
      if (res.draftId) setDraftId(res.draftId);
      setMessage({ kind: "ok", text: res.message });
    });
  }

  function handlePublish() {
    setMessage(null);
    startPublish(async () => {
      const fd = new FormData();
      if (draftId) fd.set("draftId", draftId);
      const res = await publishManualPackageDraftAction(undefined, fd);
      if (!res.ok) {
        setMessage({ kind: "err", text: res.message });
        return;
      }
      setMessage({ kind: "ok", text: res.message + " " + (res.packageId ?? "") });
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.kind === "err"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {message.text}
        </p>
      )}

      {initialDrafts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent drafts</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {initialDrafts.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <span className="font-medium text-slate-800">{d.name}</span>
                  <span className="text-slate-500"> · portal {d.sourceHubspotPortalId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadDraft(d)}
                  className="text-xs font-medium text-hub-ink hover:underline"
                >
                  Load
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Package</h2>
          <label className="block text-xs font-medium text-slate-600">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Source HubSpot portal ID
            <input
              value={portalId}
              onChange={(e) => setPortalId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="ID you are copying assets from"
            />
          </label>
          {draftId && (
            <p className="text-[11px] text-slate-500">Draft id: {draftId}</p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Select content</h2>
          <p className="text-xs text-slate-500">
            Pick HubSpot resource categories to include (mirrors the extension flow). Publishing writes a
            manifest into the library; live asset capture still happens in HubSpot or via integration.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                filterType === "all" ? "bg-slate-200 text-slate-900" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All types
            </button>
            {HUBSPOT_MANUAL_PACKAGE_RESOURCE_TYPES.slice(0, 6).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setFilterType(t);
                  setSelectedType(t);
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  filterType === t ? "bg-slate-200 text-slate-900" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="block text-xs font-medium text-slate-600">
            Resource type
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
            >
              {filteredTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Notes (optional)
            <input
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="e.g. Renewal workflow #4412"
            />
          </label>
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-hub px-3 py-1.5 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Add to manifest
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Manifest</h2>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">This package is empty — add resource types above.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-800">{i.displayLabel ?? i.resourceType}</span>
                  {i.notes && <p className="text-slate-600">{i.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={pendingSave}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            {pendingSave ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={pendingPublish || !draftId}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pendingPublish ? "Publishing…" : "Publish to library"}
          </button>
          <Link
            href="/admin/package-library"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Package library
          </Link>
        </div>
        {!draftId && (
          <p className="mt-2 text-xs text-slate-500">Save a draft at least once before publishing.</p>
        )}
      </div>
    </div>
  );
}
