"use client";

import { useMemo, useState } from "react";

import type { ImplementationPlan } from "@/src/lib/hubspot-ai/admin-implementation-types";
import { ImplementationMermaid } from "@/src/components/admin/implementation-mermaid";

const TABS = [
  { id: "overview" as const, label: "Overview" },
  { id: "model" as const, label: "Data model" },
  { id: "workflows" as const, label: "Workflows" },
  { id: "diagram" as const, label: "Flow" },
] as const;

function Markdownish({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-zinc-200">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.trim() === "") {
          return <br key={i} />;
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-zinc-300">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function ImplementationPlanOutput({
  plan,
  onNarrativeChange,
}: {
  plan: ImplementationPlan | null;
  onNarrativeChange?: (markdown: string) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");

  const checklist = plan?.implementationChecklist ?? [];

  const stats = useMemo(() => {
    if (!plan) {
      return { obj: 0, prop: 0, assoc: 0, wf: 0 };
    }
    const prop =
      plan.objects?.reduce((n, o) => n + (o.properties?.length ?? 0), 0) ?? 0;
    return {
      obj: plan.objects?.length ?? 0,
      prop,
      assoc: plan.associations?.length ?? 0,
      wf: plan.workflows?.length ?? 0,
    };
  }, [plan]);

  if (!plan) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 text-center text-sm text-zinc-500">
        Run the assistant to generate a structured plan — objects, workflows, properties, and a flow diagram.
      </div>
    );
  }

  return (
    <div className="flex min-h-[480px] flex-col rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === t.id
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="hidden shrink-0 text-[10px] text-zinc-500 sm:block">
          {stats.obj} objects · {stats.prop} props · {stats.assoc} assoc · {stats.wf} workflows
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "overview" && (
          <div className="space-y-4">
            {plan.title ? <h3 className="text-lg font-semibold text-zinc-100">{plan.title}</h3> : null}
            {onNarrativeChange ? (
              <label className="block text-xs font-medium text-zinc-500">
                Executive summary (editable)
                <textarea
                  value={plan.executiveSummary}
                  onChange={(e) => onNarrativeChange(e.target.value)}
                  rows={12}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                />
              </label>
            ) : (
              <Markdownish text={plan.executiveSummary} />
            )}
            {checklist.length > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Rollout checklist
                </h4>
                <ul className="space-y-1.5 text-sm text-zinc-300">
                  {checklist.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-zinc-600">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {tab === "model" && (
          <div className="space-y-6">
            {(plan.objects ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">No objects in this plan.</p>
            ) : (
              (plan.objects ?? []).map((obj, idx) => (
                <div
                  key={`${obj.apiName}-${idx}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-amber-200/90">
                      {obj.apiName}
                    </code>
                    {obj.label ? <span className="text-sm text-zinc-400">{obj.label}</span> : null}
                  </div>
                  {obj.purpose ? <p className="mt-2 text-sm text-zinc-400">{obj.purpose}</p> : null}
                  {(obj.properties?.length ?? 0) > 0 ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[320px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-500">
                            <th className="pb-2 pr-3 font-medium">Property</th>
                            <th className="pb-2 pr-3 font-medium">Label</th>
                            <th className="pb-2 pr-3 font-medium">Type</th>
                            <th className="pb-2 font-medium">Purpose</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-300">
                          {(obj.properties ?? []).map((p, j) => (
                            <tr key={j} className="border-b border-zinc-800/60">
                              <td className="py-2 pr-3 font-mono text-amber-100/80">{p.name}</td>
                              <td className="py-2 pr-3">{p.label ?? "—"}</td>
                              <td className="py-2 pr-3 text-zinc-400">{p.type ?? "—"}</td>
                              <td className="py-2 text-zinc-400">{p.purpose ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-600">No properties listed — refine with a prompt.</p>
                  )}
                </div>
              ))
            )}
            {(plan.associations?.length ?? 0) > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Associations
                </h4>
                <ul className="space-y-2 text-sm text-zinc-300">
                  {(plan.associations ?? []).map((a, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-800/80 bg-zinc-900/40 px-3 py-2"
                    >
                      <code className="text-amber-200/80">{a.from}</code>
                      <span className="text-zinc-600">→</span>
                      <code className="text-amber-200/80">{a.to}</code>
                      {a.label ? <span className="text-zinc-500">({a.label})</span> : null}
                      {a.cardinality ? (
                        <span className="ml-auto text-xs text-zinc-500">{a.cardinality}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {tab === "workflows" && (
          <div className="space-y-5">
            {(plan.workflows ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">No workflows in this plan.</p>
            ) : (
              (plan.workflows ?? []).map((w, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-zinc-100">{w.name}</h4>
                    {w.type ? (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
                        {w.type}
                      </span>
                    ) : null}
                  </div>
                  {w.trigger ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-400">Trigger:</span> {w.trigger}
                    </p>
                  ) : null}
                  <ol className="mt-4 space-y-3 border-l border-amber-900/40 pl-4">
                    {(w.steps ?? []).map((s, j) => (
                      <li key={j}>
                        <p className="font-medium text-zinc-200">
                          {s.order != null ? `${s.order}. ` : `${j + 1}. `}
                          {s.name}
                        </p>
                        {s.detail ? <p className="text-sm text-zinc-500">{s.detail}</p> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "diagram" && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Mermaid diagram from the model. Edit the plan with a prompt if the flow is wrong.
            </p>
            <ImplementationMermaid chart={plan.flowchartMermaid ?? ""} />
          </div>
        )}
      </div>
    </div>
  );
}
