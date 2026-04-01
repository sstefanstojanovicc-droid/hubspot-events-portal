"use client";

import Link from "next/link";
import { useActionState } from "react";

import { StatusBadge } from "@/src/components/search-board/primitives";
import {
  updateCandidateAction,
  type SearchBoardActionState,
} from "@/src/lib/platform/actions/search-board-app-actions";
import { normalizeEntryStatus } from "@/src/lib/search-board/constants";
import type {
  CandidateRecord,
  ShortlistEntryRecord,
  ShortlistRecord,
} from "@/src/lib/search-board/types";

const initial: SearchBoardActionState = { ok: false, message: "" };

export function CandidateDetailClient({
  clientId,
  candidate,
  memberships,
}: {
  clientId: string;
  candidate: CandidateRecord;
  memberships: Array<{ entry: ShortlistEntryRecord; shortlist: ShortlistRecord }>;
}) {
  const p = candidate.properties;
  const name = String(p.candidate_name ?? "Candidate");

  const [state, action] = useActionState(updateCandidateAction, initial);

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-hub">Candidate</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {p.current_title ? (
            <span>
              <span className="text-slate-400">Title</span> {String(p.current_title)}
            </span>
          ) : null}
          {p.location ? (
            <span>
              <span className="text-slate-400">Location</span> {String(p.location)}
            </span>
          ) : null}
          {p.status ? <StatusBadge label={String(p.status)} /> : null}
        </div>
        {p.summary ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-700">{String(p.summary)}</p>
        ) : null}
        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          {p.gender ? (
            <div>
              <span className="text-slate-400">Gender</span> {String(p.gender)}
            </div>
          ) : null}
          {p.hs_lastmodifieddate ? (
            <div>
              <span className="text-slate-400">Last modified (HubSpot)</span>{" "}
              {new Date(String(p.hs_lastmodifieddate)).toLocaleString()}
            </div>
          ) : null}
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
        <h2 className="text-sm font-semibold text-slate-900">CRM associations</h2>
        <p className="mt-2 text-sm text-slate-600">
          Company and standard contact links are managed in HubSpot. This portal shows custom Search
          Board objects only.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Shortlist memberships
        </h2>
        {memberships.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-600">
            This candidate is not on any shortlist yet. Add them from a shortlist board.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {memberships.map(({ entry, shortlist }) => {
              const slName = String(shortlist.properties.shortlist_name ?? "Shortlist");
              const entryStatusLabel = normalizeEntryStatus(
                String(entry.properties.shortlist_status ?? ""),
              );
              return (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <Link
                      href={`/apps/search-board/shortlists/${shortlist.id}`}
                      className="font-medium text-hub-ink hover:underline"
                    >
                      {slName}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Rank #{String(entry.properties.rank ?? "—")} · {String(shortlist.properties.client_name ?? "")}
                    </p>
                  </div>
                  <StatusBadge label={entryStatusLabel} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Edit profile</h2>
        <form
          action={action}
          className="mt-4 max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="candidateId" value={candidate.id} />
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Name
            <input
              name="candidate_name"
              defaultValue={String(p.candidate_name ?? "")}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Current title
            <input
              name="current_title"
              defaultValue={String(p.current_title ?? "")}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Location
            <input
              name="location"
              defaultValue={String(p.location ?? "")}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Gender
            <input
              name="gender"
              defaultValue={String(p.gender ?? "")}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Status
            <input
              name="status"
              defaultValue={String(p.status ?? "")}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Summary
            <textarea
              name="summary"
              rows={4}
              defaultValue={String(p.summary ?? "")}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Save changes
          </button>
          {state.message ? (
            <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {state.message}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
