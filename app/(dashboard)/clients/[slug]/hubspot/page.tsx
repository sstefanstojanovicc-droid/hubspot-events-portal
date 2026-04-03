import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { getEffectiveConnectionStatusAsync } from "@/src/lib/platform/effective-client";
import { resolveSearchBoardTenant } from "@/src/lib/search-board/data";

type PageProps = { params: Promise<{ slug: string }> };

export default async function HubSpotOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const status = await getEffectiveConnectionStatusAsync(client);
  const board = await resolveSearchBoardTenant(client.id);
  const portalUi = `https://app.hubspot.com/contacts/${client.hubspotPortalId}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-hub-bar">Overview</h2>
        <p className="mt-2 text-sm text-slate-600">
          Shared HubSpot layer for <span className="font-medium">{client.name}</span>. Object browsing
          and sync health will grow from here.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Portal ID</dt>
            <dd className="mt-1 font-mono font-medium">{client.hubspotPortalId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Connection</dt>
            <dd className="mt-1 capitalize">{status.replaceAll("_", " ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Last HubSpot sync</dt>
            <dd className="mt-1 text-slate-800">
              {client.lastHubspotSyncAt
                ? client.lastHubspotSyncAt.toLocaleString()
                : "— (updates when Search Board successfully reads CRM data)"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Search Board mapping</dt>
            <dd className="mt-1">
              {board.ok ? (
                <span className="text-emerald-800">Object type IDs resolved</span>
              ) : (
                <span className="text-amber-800">
                  Not ready — complete install in admin for live object IDs.
                </span>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={portalUi}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Open HubSpot
          </a>
          <Link
            href={`/clients/${client.slug}/hubspot/objects`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Browse objects
          </Link>
          <Link
            href="/apps/search-board"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Search Board
          </Link>
        </div>
      </div>
    </div>
  );
}
