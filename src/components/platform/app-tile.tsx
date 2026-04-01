import Link from "next/link";
import type { AppDefinition } from "@/src/types/platform-tenant";

interface AppTileProps {
  app: AppDefinition;
  href?: string;
  badge?: string;
}

export function AppTile({ app, href, badge }: AppTileProps) {
  const content = (
    <article className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{app.name}</h3>
        <div className="flex gap-2">
          <StatusPill label={app.status} />
          {badge ? <StatusPill label={badge} tone="indigo" /> : null}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">{app.description}</p>
    </article>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}

function StatusPill({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "indigo";
}) {
  const className =
    tone === "indigo"
      ? "bg-indigo-100 text-indigo-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded px-2 py-1 text-[10px] font-medium uppercase ${className}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}
