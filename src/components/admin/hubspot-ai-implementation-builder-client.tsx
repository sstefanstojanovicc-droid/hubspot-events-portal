"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import { ImplementationPlanOutput } from "@/src/components/admin/implementation-plan-output";
import { IMPLEMENTATION_AGENTS, type ImplementationPlan } from "@/src/lib/hubspot-ai/admin-implementation-types";
import {
  createPackageFromAiBuilderAction,
  runAdminImplementationAssistantAction,
} from "@/src/lib/platform/actions/hubspot-ai-admin-assistant";

export function HubspotAiImplementationBuilderClient({
  clientSlug,
  defaultPortalId,
  clientName,
}: {
  clientSlug: string;
  defaultPortalId: string;
  clientName: string;
}) {
  const [instructions, setInstructions] = useState("");
  const [plan, setPlan] = useState<ImplementationPlan | null>(null);
  const [agent, setAgent] = useState<string>(IMPLEMENTATION_AGENTS[0].id);
  const [packageName, setPackageName] = useState("");
  const [portalId, setPortalId] = useState(defaultPortalId);
  const [shortDescription, setShortDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [toolLabels, setToolLabels] = useState<{ label: string; detail?: string }[]>([]);
  const [usedOpenAI, setUsedOpenAI] = useState(false);
  const [openAiError, setOpenAiError] = useState<string | null>(null);
  const [pendingRun, startRun] = useTransition();
  const [pendingPublish, startPublish] = useTransition();

  useEffect(() => {
    setPortalId(defaultPortalId);
  }, [defaultPortalId]);

  const updatePlanSummary = useCallback((executiveSummary: string) => {
    setPlan((p) => (p ? { ...p, executiveSummary } : null));
  }, []);

  function handleRun() {
    setError(null);
    setInfo(null);
    setOpenAiError(null);
    startRun(async () => {
      const previousPlanJson = plan ? JSON.stringify(plan) : null;
      const result = await runAdminImplementationAssistantAction(
        instructions,
        clientSlug,
        agent,
        previousPlanJson,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPlan(result.plan);
      setToolLabels(result.toolLabels);
      setUsedOpenAI(result.usedOpenAI);
      setOpenAiError(result.openAiError ?? null);
      if (result.suggestedTitle && !packageName.trim()) {
        setPackageName(result.suggestedTitle);
      }
      if (result.openAiError) {
        setError(null);
        setInfo(
          `OpenAI could not complete the request (see details below). Showing a fallback mock plan. Fix billing/quota at platform.openai.com then run again.`,
        );
      } else if (result.usedOpenAI) {
        setInfo(
          "Live model finished. Refine tabs on the right or add follow-up instructions and run again.",
        );
      } else {
        setInfo("Mock plan — add OPENAI_API_KEY to .env.local and restart the dev server.");
      }
    });
  }

  function handleCreatePackage() {
    setError(null);
    setInfo(null);
    if (!plan) {
      setError("Run the assistant at least once before saving.");
      return;
    }
    startPublish(async () => {
      const fd = new FormData();
      fd.set("clientSlug", clientSlug);
      fd.set("name", packageName);
      fd.set("sourceHubspotPortalId", portalId);
      fd.set("description", shortDescription);
      fd.set("planJson", JSON.stringify(plan));
      const result = await createPackageFromAiBuilderAction(undefined, fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setInfo(result.message + " Open the library to review.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900/95 p-4 shadow-xl ring-1 ring-white/5 sm:p-5">
        <p className="text-xs text-zinc-400">
          <span className="text-zinc-200">{clientName}</span>
          <span className="text-zinc-600"> · </span>
          Resources &amp; packages are scoped to this client. Knowledge Base rules apply on every run.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Agents
            </p>
            <div className="flex flex-wrap gap-2">
              {IMPLEMENTATION_AGENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAgent(a.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                    agent === a.id
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-100 shadow-[0_0_20px_-4px_rgba(245,158,11,0.35)]"
                      : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  <span className="block font-semibold text-zinc-100">{a.label}</span>
                  <span className="mt-0.5 block text-[10px] text-zinc-500">{a.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          {(error || info) && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                error
                  ? "border-red-900/60 bg-red-950/40 text-red-200"
                  : "border-emerald-900/50 bg-emerald-950/30 text-emerald-100"
              }`}
            >
              {error ?? info}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
            <section className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">Prompt</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                Describe what to build or how to change the current plan. Running again sends your latest structured
                plan back to the model for refinement.
              </p>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={14}
                className="mt-3 min-h-[280px] w-full flex-1 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2.5 text-sm leading-relaxed text-zinc-100 shadow-inner placeholder:text-zinc-600 focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
                placeholder="e.g. Add a custom object for service milestones, associate to deals, and two workflows: handoff on Closed Won and SLA breach alert…"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={pendingRun}
                  className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
                >
                  {pendingRun ? "Building…" : "Run agent"}
                </button>
                {openAiError ? (
                  <span className="max-w-md text-[10px] text-amber-300/95" title={openAiError}>
                    API error — check quota / billing
                  </span>
                ) : usedOpenAI ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-400/90">
                    Live model
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">Mock · add OPENAI_API_KEY</span>
                )}
              </div>
              {openAiError ? (
                <pre className="mt-3 max-h-28 overflow-auto rounded-lg border border-amber-900/40 bg-amber-950/25 p-3 text-[11px] leading-snug text-amber-100/90 whitespace-pre-wrap">
                  {openAiError}
                </pre>
              ) : null}
              {toolLabels.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-500">
                  {toolLabels.map((t) => (
                    <li key={`${t.label}-${t.detail ?? ""}`}>
                      <span className="text-zinc-400">{t.label}</span>
                      {t.detail ? <span className="text-zinc-600"> — {t.detail}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="flex min-h-0 flex-col">
              <h2 className="mb-2 text-sm font-semibold text-zinc-100">Delivery blueprint</h2>
              <ImplementationPlanOutput plan={plan} onNarrativeChange={updatePlanSummary} />
            </section>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-zinc-200 shadow-lg ring-1 ring-white/5">
        <h2 className="text-sm font-semibold text-zinc-100">Save to package library</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Persists the structured plan (JSON + narrative) as the first package version for operators.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-500">
            Package name
            <input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
              placeholder="e.g. Acme — Renewal automation"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            HubSpot portal ID
            <input
              value={portalId}
              onChange={(e) => setPortalId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
              placeholder="12345678"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-medium text-zinc-500">
          Short description (library card)
          <input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            placeholder="One-line summary for operators"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCreatePackage}
            disabled={pendingPublish || !plan}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-40"
          >
            {pendingPublish ? "Saving…" : "Save plan to package"}
          </button>
          <Link
            href="/admin/package-library"
            className="rounded-lg border border-zinc-600 bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
          >
            Package library
          </Link>
          <Link
            href={`/admin/apps/hubspot-ai-implementation/${clientSlug}/packages`}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          >
            This client&apos;s packages
          </Link>
        </div>
      </section>
    </div>
  );
}
