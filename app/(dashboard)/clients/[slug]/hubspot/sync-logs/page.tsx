import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { listActivityLogsForClient } from "@/src/lib/workspace/activity-log";

type PageProps = { params: Promise<{ slug: string }> };

export default async function HubSpotSyncLogsPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const logs = await listActivityLogsForClient(client.id, 40);

  const hubRelated = logs.filter(
    (l) =>
      l.entityType.includes("hubspot") ||
      l.action.includes("hubspot") ||
      l.action.includes("sync") ||
      l.entityType === "hubspot_connection",
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-hub-bar">Sync &amp; logs</h2>
        <p className="mt-2 text-sm text-slate-600">
          HubSpot-related activity for this workspace. Full API sync traces will augment this feed.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p>
          <span className="font-semibold">Last CRM read sync:</span>{" "}
          {client.lastHubspotSyncAt
            ? client.lastHubspotSyncAt.toLocaleString()
            : "—"}
        </p>
        <p className="mt-2 text-slate-600">
          Updated when Search Board successfully loads dashboard stats from HubSpot.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Recent HubSpot-related events</h3>
          <Link
            href={`/clients/${client.slug}/logs`}
            className="text-sm font-semibold text-hub-ink hover:underline"
          >
            All workspace logs →
          </Link>
        </div>
        {hubRelated.length === 0 ? (
          <p className="text-sm text-slate-500">No HubSpot-tagged events yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
            {hubRelated.map((row) => (
              <li key={row.id} className="px-4 py-3">
                <p className="font-medium text-slate-900">{row.action}</p>
                <p className="text-xs text-slate-500">
                  {row.createdAt.toLocaleString()} · {row.entityType}
                  {row.entityId ? ` · ${row.entityId}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
