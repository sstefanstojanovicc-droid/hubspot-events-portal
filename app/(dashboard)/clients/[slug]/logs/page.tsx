import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { listActivityLogsForClient } from "@/src/lib/workspace/activity-log";

type PageProps = { params: Promise<{ slug: string }> };

export default async function WorkspaceLogsPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const logs = await listActivityLogsForClient(client.id, 200);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logs</p>
        <h1 className="text-2xl font-semibold text-hub-bar">Activity</h1>
        <p className="mt-1 text-sm text-slate-600">
          Append-only audit trail for {client.name}. API sync traces will merge into this stream.
        </p>
      </header>

      {logs.length === 0 ? (
        <p className="text-sm text-slate-600">No events recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
          {logs.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-900">{row.action}</span>
                <time className="text-xs text-slate-500">{row.createdAt.toLocaleString()}</time>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {row.entityType}
                {row.entityId ? ` · ${row.entityId}` : ""}
                {row.user?.email ? ` · ${row.user.email}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/clients/${client.slug}`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← Workspace
      </Link>
    </div>
  );
}
