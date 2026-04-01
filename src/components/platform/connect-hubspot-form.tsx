"use client";

import { useActionState } from "react";

import {
  connectHubSpotForClientAction,
  type ConnectHubSpotActionState,
} from "@/src/lib/platform/actions/hubspot-connect";

const initial: ConnectHubSpotActionState = { ok: false, message: "" };

interface ConnectHubSpotFormProps {
  clientId: string;
  /** After a successful portal match, navigate to Search Board install (RSC refresh). */
  afterSuccess?: "redirect-install";
}

export function ConnectHubSpotForm({ clientId, afterSuccess }: ConnectHubSpotFormProps) {
  const [state, formAction] = useActionState(connectHubSpotForClientAction, initial);
  const feedback =
    state.message && state.message.trim().length > 0 ? state.message.trim() : null;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="clientId" value={clientId} />
      {afterSuccess ? (
        <input type="hidden" name="afterSuccess" value={afterSuccess} />
      ) : null}
      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Connect HubSpot (dev)
      </button>
      {feedback ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
