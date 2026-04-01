"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/src/components/search-board/primitives";
import type { ShortlistRecord } from "@/src/lib/search-board/types";

export function ShortlistsIndexClient({
  shortlists,
  entryCounts,
}: {
  shortlists: ShortlistRecord[];
  entryCounts: Record<string, number>;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [consultant, setConsultant] = useState("");
  const [sort, setSort] = useState<"updated" | "expiry" | "name">("updated");

  const rows = useMemo(() => {
    let list = [...shortlists];
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter((s) => {
        const p = s.properties;
        return (
          String(p.shortlist_name ?? "")
            .toLowerCase()
            .includes(ql) ||
          String(p.client_name ?? "")
            .toLowerCase()
            .includes(ql) ||
          String(p.role_title ?? "")
            .toLowerCase()
            .includes(ql)
        );
      });
    }
    if (status) {
      list = list.filter((s) => String(s.properties.status ?? "") === status);
    }
    if (consultant) {
      list = list.filter((s) =>
        String(s.properties.consultant_name ?? "")
          .toLowerCase()
          .includes(consultant.toLowerCase()),
      );
    }
    list.sort((a, b) => {
      if (sort === "name") {
        return String(a.properties.shortlist_name ?? "").localeCompare(
          String(b.properties.shortlist_name ?? ""),
        );
      }
      if (sort === "expiry") {
        const ea = new Date(String(a.properties.portal_expiry ?? 0)).getTime();
        const eb = new Date(String(b.properties.portal_expiry ?? 0)).getTime();
        return eb - ea;
      }
      const ta = new Date(String(a.properties.hs_lastmodifieddate ?? 0)).getTime();
      const tb = new Date(String(b.properties.hs_lastmodifieddate ?? 0)).getTime();
      return tb - ta;
    });
    return list;
  }, [shortlists, q, status, consultant, sort]);

  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    for (const sl of shortlists) {
      const st = String(sl.properties.status ?? "").trim();
      if (st) s.add(st);
    }
    return [...s].sort();
  }, [shortlists]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Search
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Shortlist, client, role…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-hub focus:outline-none focus:ring-1 focus:ring-hub"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">All</option>
            {statusOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-xs font-medium text-slate-600">
          Consultant
          <input
            value={consultant}
            onChange={(e) => setConsultant(e.target.value)}
            placeholder="Filter…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm"
          >
            <option value="updated">Recently updated</option>
            <option value="expiry">Portal expiry</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-800">{rows.length}</span> of{" "}
        {shortlists.length} shortlists
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {rows.map((s) => {
          const p = s.properties;
          const name = String(p.shortlist_name ?? "Untitled");
          const cnt = entryCounts[s.id] ?? 0;
          return (
            <li
              key={s.id}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-hub-muted hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/apps/search-board/shortlists/${s.id}`}
                    className="text-lg font-semibold text-slate-900 group-hover:text-hub-ink"
                  >
                    {name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {String(p.client_name ?? "—")} · {String(p.role_title ?? "—")}
                  </p>
                </div>
                {p.status ? <StatusBadge label={String(p.status)} /> : null}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <dt className="text-slate-400">Consultant</dt>
                  <dd className="font-medium text-slate-800">
                    {String(p.consultant_name ?? "—")}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Candidates</dt>
                  <dd className="font-medium text-slate-800">{cnt}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Portal expiry</dt>
                  <dd className="font-medium text-slate-800">
                    {p.portal_expiry ? String(p.portal_expiry) : "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <Link
                  href={`/apps/search-board/shortlists/${s.id}`}
                  className="text-sm font-semibold text-hub-ink hover:underline"
                >
                  Open board →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-600">
          No shortlists match your filters. Try clearing search or create shortlists in HubSpot.
        </p>
      ) : null}
    </div>
  );
}
