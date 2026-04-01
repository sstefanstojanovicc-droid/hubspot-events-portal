import type { ReactNode } from "react";

const statusTone: Record<string, string> = {
  New: "bg-slate-100 text-slate-800 ring-slate-200",
  "Internal review": "bg-violet-50 text-violet-900 ring-violet-200",
  "Sent to client": "bg-sky-50 text-sky-900 ring-sky-200",
  "Client reviewing": "bg-amber-50 text-amber-950 ring-amber-200",
  Interview: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  Hold: "bg-orange-50 text-orange-900 ring-orange-200",
  Rejected: "bg-rose-50 text-rose-900 ring-rose-200",
  Hired: "bg-indigo-50 text-indigo-900 ring-indigo-200",
};

export function StatusBadge({ label }: { label: string }) {
  const tone = statusTone[label] ?? "bg-slate-100 text-slate-800 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
}

export function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string; 
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
