"use client";

import { useActionState } from "react";

import {
  toggleActionPlanTaskAction,
  type SimpleActionState,
} from "@/src/lib/workspace/actions/workspace-actions";

const initial: SimpleActionState = { ok: true, message: "" };

export function ActionPlanTaskToggle({
  clientId,
  clientSlug,
  planId,
  taskId,
  done,
  label,
  compact = false,
}: {
  clientId: string;
  clientSlug: string;
  planId: string;
  taskId: string;
  done: boolean;
  label: string;
  compact?: boolean;
}) {
  const [state, action] = useActionState(toggleActionPlanTaskAction, initial);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="clientAccountId" value={clientId} />
      <input type="hidden" name="clientSlug" value={clientSlug} />
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="done" value={done ? "false" : "true"} />
      {!compact ? (
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" checked={done} readOnly className="mt-1" />
          <span className={done ? "text-slate-500 line-through" : "text-slate-900"}>{label}</span>
        </label>
      ) : (
        <span className="sr-only">{label || (done ? "Completed task" : "Open task")}</span>
      )}
      <button
        type="submit"
        className={`rounded-md border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 ${
          compact ? "px-3 py-1.5 text-xs" : "px-2 py-1 text-xs"
        }`}
      >
        {done ? "Reopen" : "Complete"}
      </button>
      {state.message ? (
        <span className={`text-xs ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
