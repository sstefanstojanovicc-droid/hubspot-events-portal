"use client";

import { useState } from "react";

import { OpenInHubSpotIconLink } from "@/src/components/hubspot/open-in-hubspot";
import { ActionPlanTaskToggle } from "@/src/components/workspace/action-plan-task-toggle";

export type SuperedTaskWire = {
  id: string;
  title: string;
  done: boolean;
  dueAt: string | null;
  assignee: { name: string | null; email: string | null } | null;
  cards: { id: string; cardType: string; payloadJson: string }[];
};

export type SuperedSectionWire = {
  title: string;
  tasks: SuperedTaskWire[];
};

export type SuperedPhaseWire = {
  title: string;
  sections: SuperedSectionWire[];
};

function parsePayload(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function ActionPlanCardBody({
  cardType,
  payloadJson,
}: {
  cardType: string;
  payloadJson: string;
}) {
  const p = parsePayload(payloadJson);

  switch (cardType) {
    case "text": {
      const text = String(p.text ?? p.body ?? "").trim() || "—";
      return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{text}</div>
      );
    }
    case "link": {
      const url = String(p.url ?? "").trim();
      const label = String(p.label ?? url).trim() || "Link";
      if (!url) {
        return <p className="text-sm text-slate-500">No URL configured.</p>;
      }
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-hub-ink hover:underline"
        >
          {label} →
        </a>
      );
    }
    case "file": {
      const name = String(p.name ?? "File").trim();
      const url = String(p.url ?? "").trim();
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-hub-ink hover:underline"
        >
          {name} →
        </a>
      ) : (
        <p className="text-sm text-slate-700">{name}</p>
      );
    }
    case "video": {
      const url = String(p.url ?? "").trim();
      if (!url) {
        return <p className="text-sm text-slate-500">No video URL.</p>;
      }
      return (
        <div className="space-y-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-hub-ink hover:underline"
          >
            Open video →
          </a>
          {url.includes("youtube.com") || url.includes("youtu.be") ? (
            <p className="text-xs text-slate-500">Embed player can be added when URLs are whitelisted.</p>
          ) : null}
        </div>
      );
    }
    case "hubspot_record_link": {
      const portalId = String(p.portalId ?? "").trim();
      const objectTypeId = String(p.objectTypeId ?? "").trim();
      const recordId = String(p.recordId ?? "").trim();
      const label = String(p.label ?? "Open in HubSpot").trim();
      if (!portalId || !objectTypeId || !recordId) {
        return (
          <p className="text-sm text-slate-500">
            HubSpot record link incomplete (needs portal, object type, and record id).
          </p>
        );
      }
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-700">{label}</span>
          <OpenInHubSpotIconLink
            portalId={portalId}
            objectTypeId={objectTypeId}
            recordId={recordId}
            title={label}
          />
        </div>
      );
    }
    case "checklist": {
      const items = p.items;
      const list = Array.isArray(items)
        ? items.map((x) => String(x)).filter(Boolean)
        : [];
      if (list.length === 0) {
        return <p className="text-sm text-slate-500">Empty checklist.</p>;
      }
      return (
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    case "warning": {
      const message = String(p.message ?? p.text ?? "Warning").trim();
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {message}
        </div>
      );
    }
    default:
      return (
        <pre className="max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-xs text-slate-600">
          {payloadJson || "{}"}
        </pre>
      );
  }
}

function TaskRow({
  task,
  clientId,
  clientSlug,
  planId,
  hubspotPortalId,
}: {
  task: SuperedTaskWire;
  clientId: string;
  clientSlug: string;
  planId: string;
  hubspotPortalId: string;
}) {
  const [open, setOpen] = useState(false);
  const due = task.dueAt ? new Date(task.dueAt) : null;
  const dueLabel =
    due && Number.isFinite(due.getTime()) ? due.toLocaleDateString() : null;

  return (
    <li className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-semibold ${task.done ? "text-slate-400 line-through" : "text-slate-900"}`}
            >
              {task.title}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {open ? "Hide" : "Expand"}
            </span>
            {task.done ? (
              <span className="text-xs font-medium text-emerald-600">Done</span>
            ) : null}
          </div>
          {dueLabel || task.assignee?.email ? (
            <p className="mt-1 text-xs text-slate-500">
              {dueLabel ? <>Due {dueLabel}</> : null}
              {dueLabel && task.assignee?.email ? " · " : null}
              {task.assignee?.email ?? task.assignee?.name ?? ""}
            </p>
          ) : null}
        </button>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <ActionPlanTaskToggle
            clientId={clientId}
            clientSlug={clientSlug}
            planId={planId}
            taskId={task.id}
            done={task.done}
            label=""
            compact
          />
        </div>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-3 py-4 sm:px-4">
          {task.cards.length === 0 ? (
            <p className="text-sm text-slate-500">No cards on this task yet.</p>
          ) : (
            <ul className="space-y-3">
              {task.cards.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {c.cardType.replaceAll("_", " ")}
                  </p>
                  <div className="mt-2">
                    <ActionPlanCardBody cardType={c.cardType} payloadJson={c.payloadJson} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-slate-400">
            Portal context:{" "}
            <span className="font-mono text-slate-600">{hubspotPortalId}</span>
          </p>
        </div>
      ) : null}
    </li>
  );
}

export function ActionPlanSuperedDetail({
  phases,
  clientId,
  clientSlug,
  planId,
  hubspotPortalId,
}: {
  phases: SuperedPhaseWire[];
  clientId: string;
  clientSlug: string;
  planId: string;
  hubspotPortalId: string;
}) {
  return (
    <div className="space-y-10">
      {phases.map((phase) => (
        <section key={phase.title} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <h2 className="text-base font-bold tracking-tight text-hub-bar">{phase.title}</h2>
            <span className="text-xs font-medium uppercase text-slate-400">Phase</span>
          </div>
          {phase.sections.map((sec) => (
            <div key={`${phase.title}-${sec.title}`} className="space-y-3 pl-0 sm:pl-3">
              <h3 className="text-sm font-semibold text-slate-800">{sec.title}</h3>
              <ul className="space-y-3">
                {sec.tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    clientId={clientId}
                    clientSlug={clientSlug}
                    planId={planId}
                    hubspotPortalId={hubspotPortalId}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
      <p className="text-xs text-slate-500">
        Phases → sections → tasks → cards (Supered-style). Use{" "}
        <span className="font-medium text-slate-600">Expand</span> to open task content.
      </p>
    </div>
  );
}
