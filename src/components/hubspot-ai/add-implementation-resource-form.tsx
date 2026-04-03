"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { addImplementationResource } from "@/src/lib/hubspot-ai/actions/resources";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-hub-ink px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Add"}
    </button>
  );
}

export function AddImplementationResourceForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, formAction] = useFormState(addImplementationResource, undefined);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          Type
          <select
            name="type"
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
          >
            <option value="sow">SOW</option>
            <option value="notes">Notes</option>
            <option value="company_site">Company site</option>
            <option value="fathom_calls">Fathom calls</option>
            <option value="miro_board">Miro board</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Title
          <input
            name="title"
            required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
            placeholder="e.g. Renewal SOW v2"
          />
        </label>
      </div>
      <label className="block text-xs font-medium text-slate-600">
        URL (optional)
        <input
          name="url"
          type="url"
          className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
          placeholder="https://…"
        />
      </label>
      <label className="block text-xs font-medium text-slate-600">
        Notes (optional)
        <textarea
          name="content"
          rows={2}
          className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
        />
      </label>
      <div className="flex items-center gap-2">
        <SubmitButton />
        {state?.ok ? (
          <span className="text-xs text-emerald-700">{state.message}</span>
        ) : state?.message ? (
          <span className="text-xs text-red-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
