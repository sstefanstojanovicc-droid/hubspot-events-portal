"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createCandidateAction,
  type SearchBoardActionState,
} from "@/src/lib/platform/actions/search-board-app-actions";

const initial: SearchBoardActionState = { ok: false, message: "" };

export function CreateCandidateModal({
  clientId,
  label = "Create candidate",
  variant = "primary",
}: {
  clientId: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createCandidateAction, initial);
  const router = useRouter();

  useEffect(() => {
    if (!state.ok || !open) return;
    const id = state.message?.trim() ?? "";
    if (id && /^\d+$/.test(id)) {
      router.push(`/apps/search-board/candidates/${id}`);
      setOpen(false);
    }
  }, [state.ok, state.message, open, router]);

  const btnClass =
    variant === "secondary"
      ? "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
      : "rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClass}>
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">New candidate</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Creates a master candidate profile in HubSpot. Add them to a shortlist from the board.
            </p>
            <form action={action} className="mt-4 space-y-3">
              <input type="hidden" name="clientId" value={clientId} />
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Name <span className="text-rose-600">*</span>
                <input
                  name="candidate_name"
                  required
                  className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Current title
                <input name="current_title" className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Location
                <input name="location" className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Gender
                <input name="gender" className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Candidate status
                <input name="status" className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Summary
                <textarea name="summary" rows={3} className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-hub py-2 text-sm font-semibold text-white hover:bg-hub-hover"
                >
                  Create profile
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
              </div>
              {state.message && !state.ok ? (
                <p className="text-sm text-rose-700">{state.message}</p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
