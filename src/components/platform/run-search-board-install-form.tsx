"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";

import {
  runSearchBoardInstallAction,
  type RunSearchBoardInstallState,
} from "@/src/lib/platform/actions/search-board-install";

const initial: RunSearchBoardInstallState = { ok: false, message: "" };

function InstallSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={
        disabled || pending
          ? "cursor-not-allowed rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
          : "rounded-md bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
      }
    >
      {pending ? "Running…" : "Run setup"}
    </button>
  );
}

interface RunSearchBoardInstallFormProps {
  clientId: string;
  disabled: boolean;
  disabledReason?: string;
}

export function RunSearchBoardInstallForm({
  clientId,
  disabled,
  disabledReason,
}: RunSearchBoardInstallFormProps) {
  const [state, formAction] = useActionState(runSearchBoardInstallAction, initial);
  const feedback =
    state.message && state.message.trim().length > 0 ? state.message.trim() : null;

  const countsSummary = useMemo(() => {
    const c = state.report?.counts;
    if (!c) return null;
    return [
      `Schemas +${c.schemasCreated} / skipped ${c.schemasSkipped}`,
      `Groups +${c.groupsCreated} / skipped ${c.groupsSkipped}`,
      `Properties +${c.propertiesCreated} / skipped ${c.propertiesSkipped}`,
      `Associations +${c.associationsCreated} / skipped ${c.associationsSkipped}`,
    ].join(" · ");
  }, [state.report?.counts]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <InstallSubmitButton disabled={disabled} />
      {disabled && disabledReason ? (
        <p className="text-sm text-slate-600">{disabledReason}</p>
      ) : null}
      {feedback ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{feedback}</p>
      ) : null}
      {state.report && !state.report.ok ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-950">
          <p className="font-semibold">
            Failed step: <code className="text-xs">{state.report.failedStep ?? "unknown"}</code>
          </p>
          {state.report.hubspotMessage ? (
            <p className="mt-1 text-xs text-rose-900">{state.report.hubspotMessage}</p>
          ) : null}
          {countsSummary ? (
            <p className="mt-2 text-xs text-rose-800">Progress before failure: {countsSummary}</p>
          ) : null}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-rose-900">Log</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[11px] text-rose-900">
              {state.report.log.join("\n")}
            </pre>
          </details>
        </div>
      ) : null}
    </form>
  );
}
