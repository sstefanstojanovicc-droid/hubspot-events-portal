"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveHubspotAiWritePlan,
  runApprovedHubspotAiWritePlan,
} from "@/src/lib/hubspot-ai/actions/write-plans";

type PlanRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  operationCount: number;
  recordsAffected: number | null;
  createdAt: string;
  approvedAt: string | null;
  operations: {
    id: string;
    order: number;
    type: string;
    targetObject: string | null;
    actionSummary: string;
    payloadSummary: string | null;
    hubspotUrl: string | null;
  }[];
};

function statusStyle(s: string): string {
  switch (s) {
    case "DRAFT":
      return "bg-amber-100 text-amber-900";
    case "APPROVED":
      return "bg-sky-100 text-sky-900";
    case "RUNNING":
      return "bg-violet-100 text-violet-900";
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-900";
    case "PARTIAL":
      return "bg-orange-100 text-orange-900";
    case "FAILED":
      return "bg-red-100 text-red-900";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export function HubspotAiPlansClient({
  slug,
  plans,
}: {
  slug: string;
  plans: PlanRow[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(plans[0]?.id ?? null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {plans.length === 0 ? (
        <p className="text-sm text-slate-600">
          No plans yet. Open a thread, ask about renewals, then generate a write plan.
        </p>
      ) : (
        plans.map((plan) => {
          const open = openId === plan.id;
          return (
            <div
              key={plan.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : plan.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-hub-bar">{plan.title}</p>
                  <p className="text-xs text-slate-500">
                    {plan.operationCount} operations ·{" "}
                    {new Date(plan.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(plan.status)}`}
                >
                  {plan.status}
                </span>
              </button>
              {open ? (
                <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-700">
                  {plan.description ? (
                    <p className="mb-3 text-slate-600">{plan.description}</p>
                  ) : null}
                  <ol className="space-y-2">
                    {plan.operations.map((op) => (
                      <li
                        key={op.id}
                        className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">
                            #{op.order}
                          </span>
                          <span className="text-xs font-semibold uppercase text-slate-500">
                            {op.type}
                          </span>
                          {op.hubspotUrl ? (
                            <a
                              href={op.hubspotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-hub-ink hover:underline"
                            >
                              Open in HubSpot
                            </a>
                          ) : null}
                        </div>
                        <p className="mt-1">{op.actionSummary}</p>
                        {op.payloadSummary ? (
                          <p className="mt-1 text-xs text-slate-500">{op.payloadSummary}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan.status === "DRAFT" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await approveHubspotAiWritePlan(slug, plan.id);
                            router.refresh();
                          })
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
                      >
                        Approve
                      </button>
                    ) : null}
                    {plan.status === "APPROVED" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await runApprovedHubspotAiWritePlan(slug, plan.id);
                            router.refresh();
                          })
                        }
                        className="rounded-md bg-hub-ink px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                      >
                        Run (simulated)
                      </button>
                    ) : null}
                    {plan.recordsAffected != null ? (
                      <span className="self-center text-xs text-slate-500">
                        Records affected (mock): {plan.recordsAffected}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
