import Link from "next/link";

import { OpenInHubSpotIconLink } from "@/src/components/hubspot/open-in-hubspot";
import { syncHubSpotNowFormAction } from "@/src/lib/workspace/actions/workspace-actions";
import { getClientHubSpotLinkRecord } from "@/src/lib/platform/client-connection-store";
import {
  getEffectiveConnectionStatusAsync,
  getInstalledAppsWithOverridesAsync,
} from "@/src/lib/platform/effective-client";
import {
  loadDashboardStats,
  resolveSearchBoardTenant,
} from "@/src/lib/search-board/data";
import type { ClientAccount } from "@/src/types/platform-tenant";
import {
  countActiveActionPlans,
  countOverdueTasks,
} from "@/src/lib/workspace/action-plans-repo";
import { listActivityLogsForClient } from "@/src/lib/workspace/activity-log";
import { listFathomCallsForClient } from "@/src/lib/workspace/fathom-repo";
import { listInstallationsForClient } from "@/src/lib/workspace/packages-repo";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-black/[0.03] ${className}`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function envBadgeLabel(): string {
  return process.env.NODE_ENV === "production" ? "Production" : "Development";
}

type ContactRow = { name?: string; email?: string; role?: string };

function parsePrimaryContactsJson(raw: string): ContactRow[] {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter((x) => x && typeof x === "object")
      .map((x) => x as Record<string, unknown>)
      .map((o) => ({
        name: typeof o.name === "string" ? o.name : undefined,
        email: typeof o.email === "string" ? o.email : undefined,
        role: typeof o.role === "string" ? o.role : undefined,
      }))
      .filter((c) => c.name || c.email);
  } catch {
    return [];
  }
}

export async function ClientWorkspaceDashboard({ client }: { client: ClientAccount }) {
  const [
    effectiveStatus,
    apps,
    link,
    boardGate,
    activePlans,
    overdueTasks,
    recentCalls,
    installations,
    activityTail,
  ] = await Promise.all([
    getEffectiveConnectionStatusAsync(client),
    getInstalledAppsWithOverridesAsync(client.id),
    Promise.resolve(getClientHubSpotLinkRecord(client.id)),
    resolveSearchBoardTenant(client.id),
    countActiveActionPlans(client.id),
    countOverdueTasks(client.id),
    listFathomCallsForClient(client.id, 4),
    listInstallationsForClient(client.id),
    listActivityLogsForClient(client.id, 10),
  ]);

  const stats = boardGate.ok ? await loadDashboardStats(client.id) : null;

  const portalUi = `https://app.hubspot.com/contacts/${client.hubspotPortalId}`;
  const shortlistTypeId = boardGate.ok ? boardGate.tenant.shortlistTypeId : "";
  const primaryContacts = parsePrimaryContactsJson(client.primaryContactsJson);
  const hubspotClientNameFromSearch =
    stats?.ok && stats.recentShortlists.length > 0
      ? String(stats.recentShortlists[0].properties.client_name ?? "").trim()
      : "";

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-hub-bar">
                {client.name}
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {envBadgeLabel()}
              </span>
            </div>
            <p className="mt-2 font-mono text-sm text-slate-600">{client.slug}</p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  HubSpot portal
                </dt>
                <dd className="mt-0.5 font-mono font-medium text-slate-800">
                  {client.hubspotPortalId}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Connection
                </dt>
                <dd className="mt-0.5 font-medium capitalize text-slate-800">
                  {effectiveStatus.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  HubSpot link (session)
                </dt>
                <dd className="mt-0.5 text-slate-800">
                  {link?.updatedAt
                    ? new Date(link.updatedAt).toLocaleString()
                    : "Not linked this session"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Last CRM data sync
                </dt>
                <dd className="mt-0.5 text-slate-800">
                  {client.lastHubspotSyncAt
                    ? client.lastHubspotSyncAt.toLocaleString()
                    : "—"}
                </dd>
              </div>
              {hubspotClientNameFromSearch ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Client (from Search Board)
                  </dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{hubspotClientNameFromSearch}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Quick actions
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={portalUi}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
              >
                Open in HubSpot
              </a>
              <form action={syncHubSpotNowFormAction} className="inline">
                <input type="hidden" name="clientAccountId" value={client.id} />
                <input type="hidden" name="clientSlug" value={client.slug} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  Sync now
                </button>
              </form>
              <Link
                href={`/clients/${client.slug}/action-plans`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Action Plans
              </Link>
              <Link
                href={`/clients/${client.slug}/packages`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Packages
              </Link>
              <Link
                href={`/clients/${client.slug}/hubspot`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                HubSpot module
              </Link>
              <Link
                href={`/clients/${client.slug}/settings`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          <strong className="font-medium text-slate-600">Sync now</strong> records a sync request and
          refreshes timestamps; Search Board and other apps pull live CRM data when you use them. A
          full scheduler will layer on top as the HubSpot module expands.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Account summary">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Workspace</dt>
              <dd className="font-medium text-slate-900">{client.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Created</dt>
              <dd className="text-slate-800">
                {client.createdAt.toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Website</dt>
              <dd className="text-slate-800">
                {client.websiteUrl ? (
                  <a
                    href={client.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-hub-ink hover:underline"
                  >
                    {client.websiteUrl}
                  </a>
                ) : (
                  <span className="text-slate-500">
                    Not set — add under Settings → General.
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Primary contacts</dt>
              <dd className="text-slate-800">
                {primaryContacts.length === 0 ? (
                  <span className="text-slate-500">
                    None on file — add JSON in Settings → General, or rely on HubSpot owners.
                  </span>
                ) : (
                  <ul className="space-y-1">
                    {primaryContacts.map((c, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{c.name ?? "—"}</span>
                        {c.role ? (
                          <span className="text-slate-500"> · {c.role}</span>
                        ) : null}
                        {c.email ? (
                          <span className="block text-slate-600">{c.email}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Latest activity</dt>
              <dd className="text-slate-600">
                {link?.updatedAt
                  ? `HubSpot link updated ${new Date(link.updatedAt).toLocaleString()}`
                  : "No recent workspace events yet."}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="HubSpot connection">
          <p className="text-sm text-slate-700">
            Status:{" "}
            <span className="font-semibold capitalize">
              {effectiveStatus.replaceAll("_", " ")}
            </span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Portal <span className="font-mono">{client.hubspotPortalId}</span>. Schema and sync
            health will surface here as the HubSpot module grows.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={portalUi}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-hub-ink hover:underline"
            >
              Open portal →
            </a>
            <Link
              href={`/clients/${client.slug}/hubspot`}
              className="text-sm font-semibold text-hub-ink hover:underline"
            >
              HubSpot overview →
            </Link>
            <Link
              href={`/admin/clients/${client.id}/apps/search-board/install`}
              className="text-sm font-semibold text-slate-600 hover:underline"
            >
              Search Board setup →
            </Link>
          </div>
        </Card>

        <Card title="Apps connected">
          {apps.filter((a) => a.enabled).length === 0 ? (
            <p className="text-sm text-slate-600">No apps enabled yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {apps
                .filter((a) => a.enabled)
                .map((row) => (
                  <li
                    key={row.app.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                  >
                    <span className="font-medium text-slate-900">{row.app.name}</span>
                    <span className="text-xs capitalize text-slate-500">
                      {row.mappingStatus.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <Link
            href={`/clients/${client.slug}/apps`}
            className="mt-4 inline-block text-sm font-semibold text-hub-ink hover:underline"
          >
            Manage apps →
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Active Action Plans">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Active plans</dt>
              <dd className="font-semibold text-slate-900">{activePlans}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Overdue tasks</dt>
              <dd className="font-semibold text-rose-700">{overdueTasks}</dd>
            </div>
          </dl>
          <Link
            href={`/clients/${client.slug}/action-plans`}
            className="mt-4 inline-block text-sm font-semibold text-hub-ink hover:underline"
          >
            Open Action Plans →
          </Link>
        </Card>

        <Card title="Recent Fathom calls">
          {recentCalls.length === 0 ? (
            <p className="text-sm text-slate-600">No calls logged yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentCalls.map((c) => (
                <li key={c.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <Link
                    href={`/clients/${client.slug}/fathom-calls/${c.id}`}
                    className="font-medium text-hub-ink hover:underline"
                  >
                    {c.title}
                  </Link>
                  <span className="shrink-0 text-xs text-slate-500">
                    {c.extractionStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/clients/${client.slug}/fathom-calls`}
            className="mt-4 inline-block text-sm font-semibold text-hub-ink hover:underline"
          >
            All Fathom calls →
          </Link>
        </Card>

        <Card title="Installed packages">
          {installations.length === 0 ? (
            <p className="text-sm text-slate-600">No packages installed on this workspace.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {installations.slice(0, 5).map((ins) => (
                <li key={ins.id} className="flex justify-between gap-2">
                  <span className="font-medium text-slate-900">
                    {ins.version.package.name}
                  </span>
                  <span className="text-xs text-slate-500">{ins.version.versionLabel}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/clients/${client.slug}/packages`}
            className="mt-4 inline-block text-sm font-semibold text-hub-ink hover:underline"
          >
            Packages →
          </Link>
        </Card>
      </div>

      <Card title="Search Board snapshot">
        {!boardGate.ok ? (
          <p className="text-sm text-slate-600">
            Search Board needs HubSpot mapping or token.{" "}
            <Link
              href={`/admin/clients/${client.id}/apps/search-board/install`}
              className="font-semibold text-hub-ink hover:underline"
            >
              Complete setup
            </Link>
            .
          </p>
        ) : stats && !stats.ok ? (
          <p className="text-sm text-rose-700">
            {stats.error.code === "hubspot"
              ? stats.error.message
              : "Could not load Search Board stats."}
          </p>
        ) : stats?.ok ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Shortlists</p>
                <p className="text-lg font-semibold text-slate-900">
                  {stats.activeShortlists}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Candidates</p>
                <p className="text-lg font-semibold text-slate-900">
                  {stats.totalCandidates}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">In review / interview</p>
                <p className="text-lg font-semibold text-slate-900">
                  {stats.candidatesInReview}
                </p>
              </div>
            </div>
            {stats.recentShortlists.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recent shortlists
                </p>
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {stats.recentShortlists.slice(0, 5).map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <Link
                        href={`/apps/search-board/shortlists/${s.id}`}
                        className="font-medium text-slate-900 hover:text-hub-ink"
                      >
                        {String(s.properties.shortlist_name ?? "Shortlist")}
                      </Link>
                      {shortlistTypeId ? (
                        <OpenInHubSpotIconLink
                          portalId={client.hubspotPortalId}
                          objectTypeId={shortlistTypeId}
                          recordId={s.id}
                          title="Open shortlist in HubSpot"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Link
              href="/apps/search-board"
              className="inline-block text-sm font-semibold text-hub-ink hover:underline"
            >
              Open Search Board →
            </Link>
          </div>
        ) : null}
      </Card>

      <Card title="Recent activity">
        {activityTail.length === 0 ? (
          <p className="text-sm text-slate-600">No logged events yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {activityTail.map((row) => (
              <li key={row.id} className="py-2">
                <p className="font-medium text-slate-800">{row.action}</p>
                <p className="text-xs text-slate-500">
                  {row.createdAt.toLocaleString()}
                  {row.user?.email ? ` · ${row.user.email}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/clients/${client.slug}/logs`}
          className="mt-4 inline-block text-sm font-semibold text-hub-ink hover:underline"
        >
          Full log →
        </Link>
      </Card>
    </div>
  );
}
