"use client";

import { useMemo, useState } from "react";

import { ImplementationMermaid } from "@/src/components/admin/implementation-mermaid";
import {
  type ImplementationPlan,
  parseSerializedPackageNotes,
} from "@/src/lib/hubspot-ai/admin-implementation-types";

const TABS = [
  { id: "overview" as const, label: "Overview" },
  { id: "model" as const, label: "Data model" },
  { id: "workflows" as const, label: "Workflows" },
  { id: "diagram" as const, label: "Flow" },
] as const;

function LightMarkdownish({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="max-w-none text-sm text-slate-700">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-hub-bar">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.trim() === "") {
          return <br key={i} />;
        }
        return (
          <p key={i} className="leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function PlanTabsReadOnly({ plan }: { plan: ImplementationPlan }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const checklist = plan.implementationChecklist ?? [];

  const stats = useMemo(() => {
    const prop =
      plan.objects?.reduce((n, o) => n + (o.properties?.length ?? 0), 0) ?? 0;
    return {
      obj: plan.objects?.length ?? 0,
      prop,
      assoc: plan.associations?.length ?? 0,
      wf: plan.workflows?.length ?? 0,
    };
  }, [plan]);

  return (
    <div className="flex min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === t.id
                  ? "bg-hub-bar text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="hidden shrink-0 text-[10px] text-slate-500 sm:block">
          {stats.obj} objects · {stats.prop} props · {stats.assoc} assoc · {stats.wf} workflows
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "overview" && (
          <div className="space-y-4">
            {plan.title ? <h3 className="text-lg font-semibold text-hub-bar">{plan.title}</h3> : null}
            <LightMarkdownish text={plan.executiveSummary} />
            {checklist.length > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rollout checklist
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {checklist.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-400">{i + 1}.</span>
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
              <p className="text-sm text-slate-500">No objects in this version.</p>
            ) : (
              (plan.objects ?? []).map((obj, idx) => (
                <div
                  key={`${obj.apiName}-${idx}`}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <code className="rounded bg-white px-1.5 py-0.5 text-sm font-medium text-hub-ink shadow-sm ring-1 ring-slate-200">
                      {obj.apiName}
                    </code>
                    {obj.label ? <span className="text-sm text-slate-600">{obj.label}</span> : null}
                  </div>
                  {obj.purpose ? <p className="mt-2 text-sm text-slate-600">{obj.purpose}</p> : null}
                  {(obj.properties?.length ?? 0) > 0 ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[320px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-2 pr-3 font-medium">Property</th>
                            <th className="pb-2 pr-3 font-medium">Label</th>
                            <th className="pb-2 pr-3 font-medium">Type</th>
                            <th className="pb-2 font-medium">Purpose</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-700">
                          {(obj.properties ?? []).map((p, j) => (
                            <tr key={j} className="border-b border-slate-100">
                              <td className="py-2 pr-3 font-mono text-[13px] text-hub-bar">{p.name}</td>
                              <td className="py-2 pr-3">{p.label ?? "—"}</td>
                              <td className="py-2 pr-3 text-slate-500">{p.type ?? "—"}</td>
                              <td className="py-2 text-slate-600">{p.purpose ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No properties listed for this object.</p>
                  )}
                </div>
              ))
            )}
            {(plan.associations?.length ?? 0) > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Associations
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  {(plan.associations ?? []).map((a, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <code className="text-hub-bar">{a.from}</code>
                      <span className="text-slate-400">→</span>
                      <code className="text-hub-bar">{a.to}</code>
                      {a.label ? <span className="text-slate-500">({a.label})</span> : null}
                      {a.cardinality ? (
                        <span className="ml-auto text-xs text-slate-500">{a.cardinality}</span>
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
              <p className="text-sm text-slate-500">No workflows in this version.</p>
            ) : (
              (plan.workflows ?? []).map((w, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-hub-bar">{w.name}</h4>
                    {w.type ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                        {w.type}
                      </span>
                    ) : null}
                  </div>
                  {w.trigger ? (
                    <p className="mt-2 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Trigger:</span> {w.trigger}
                    </p>
                  ) : null}
                  <ol className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4">
                    {(w.steps ?? []).map((s, j) => (
                      <li key={j}>
                        <p className="font-medium text-slate-800">
                          {s.order != null ? `${s.order}. ` : `${j + 1}. `}
                          {s.name}
                        </p>
                        {s.detail ? <p className="text-sm text-slate-600">{s.detail}</p> : null}
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
            <p className="text-xs text-slate-500">Flow diagram for this package version.</p>
            <ImplementationMermaid chart={plan.flowchartMermaid ?? ""} variant="light" />
          </div>
        )}
      </div>
    </div>
  );
}

export function PackageVersionPlanView({ notes }: { notes: string }) {
  const parsed = useMemo(() => parseSerializedPackageNotes(notes), [notes]);
  const { executiveSummary, plan } = parsed;

  if (!notes.trim()) {
    return <p className="text-xs text-slate-500">No notes on this version.</p>;
  }

  return (
    <div className="space-y-3">
      {plan ? (
        <PlanTabsReadOnly plan={plan} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Summary</p>
          <div className="mt-2">
            <LightMarkdownish text={executiveSummary || notes.slice(0, 8000)} />
          </div>
        </div>
      )}

      <details className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 text-xs text-slate-600">
        <summary className="cursor-pointer select-none px-3 py-2 font-medium text-slate-700 hover:bg-slate-100/80">
          Source notes (includes JSON for exports)
        </summary>
        <pre className="max-h-64 overflow-auto border-t border-slate-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap">
          {notes}
        </pre>
      </details>
    </div>
  );
}
