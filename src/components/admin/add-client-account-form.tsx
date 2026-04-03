"use client";

import { useActionState } from "react";

import {
  createClientAccountAction,
  type CreateClientAccountState,
} from "@/src/lib/platform/actions/client-accounts";

const initial: CreateClientAccountState = { ok: true, message: "" };

export function AddClientAccountForm() {
  const [state, formAction, pending] = useActionState(createClientAccountAction, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-hub-bar">Add client account</h3>
      <p className="text-xs text-slate-600">
        Creates a new tenant. Enable Search Board setup per client after connecting HubSpot.
      </p>
      <div>
        <label htmlFor="acct-name" className="block text-xs font-medium text-slate-600">
          Display name
        </label>
        <input
          id="acct-name"
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Acme Search"
        />
      </div>
      <div>
        <label htmlFor="acct-slug" className="block text-xs font-medium text-slate-600">
          URL slug <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="acct-slug"
          name="slug"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          placeholder="acme-search"
        />
      </div>
      <div>
        <label htmlFor="acct-portal" className="block text-xs font-medium text-slate-600">
          HubSpot portal ID
        </label>
        <input
          id="acct-portal"
          name="hubspotPortalId"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
          placeholder="12345678"
        />
      </div>
      {state.message ? (
        <p
          className={`text-sm ${state.ok ? "text-emerald-800" : "text-rose-700"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-hub px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover disabled:opacity-60"
      >
        {pending ? "Creating…" : "Add client account"}
      </button>
    </form>
  );
}
