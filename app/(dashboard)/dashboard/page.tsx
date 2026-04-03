import Link from "next/link";

import { auth } from "@/auth";
import { AddClientAccountForm } from "@/src/components/admin/add-client-account-form";
import { AdminClientsOverviewTable } from "@/src/components/admin/admin-clients-overview-table";
import { hubspotClient } from "@/src/lib/hubspot/client";
import { buildAdminClientsOverview } from "@/src/lib/platform/admin-clients-overview";
import { getClientAccountById, listClientAccounts } from "@/src/lib/platform/client-accounts-repo";
import { appDefinitions } from "@/src/lib/platform/mock-data";

export default async function DashboardPage() {
  const session = await auth();
  const status = hubspotClient.getStatus();
  const clients = await listClientAccounts();
  const first = clients[0];
  const isPlatformAdmin = session?.user?.role === "admin";
  const tenantClient =
    session?.user?.clientAccountId && session.user.role !== "admin"
      ? await getClientAccountById(session.user.clientAccountId)
      : null;

  const overview = isPlatformAdmin ? await buildAdminClientsOverview(clients) : null;
  const connected = overview?.filter((r) => r.hubspotConnection === "connected").length ?? 0;
  const totalShortlists =
    overview?.reduce((n, r) => n + (r.shortlistCount ?? 0), 0) ?? 0;
  const totalCandidates =
    overview?.reduce((n, r) => n + (r.candidateCount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-hub-bar">Dashboard</h2>
        {session?.user?.role === "client_admin" ? (
          <p className="mt-1 text-sm text-slate-600">
            Tenant admin — open your workspace below. Platform tools need an{" "}
            <code className="text-xs">admin</code> role.
          </p>
        ) : isPlatformAdmin ? (
          <p className="mt-1 text-sm text-slate-600">
            Platform overview: clients, connections, Search Board volume, and quick actions.
          </p>
        ) : null}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Clients" value={String(clients.length)} />
        <StatCard
          label="HubSpot API"
          value={status.hasToken ? "Ready" : "Not configured"}
        />
        <StatCard label="App catalog" value={String(appDefinitions.length)} />
        {isPlatformAdmin && overview ? (
          <>
            <StatCard label="HS connected" value={`${connected}/${clients.length}`} />
            <StatCard label="Shortlists (total)" value={String(totalShortlists)} />
            <StatCard label="Candidates (total)" value={String(totalCandidates)} />
          </>
        ) : (
          <StatCard label="Search Board" value="Per tenant" />
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {tenantClient ? (
          <Link
            href={`/clients/${tenantClient.slug}`}
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
          >
            My workspace
          </Link>
        ) : null}
        {isPlatformAdmin ? (
          <>
            <Link
              href="/admin/clients"
              className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
            >
              Clients
            </Link>
            <Link
              href="/apps/search-board"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-hub-muted"
            >
              Search Board
            </Link>
            <Link
              href="/admin/apps/hubspot-ai-implementation/knowledge-base"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-hub-muted"
            >
              HubSpot AI Implementation
            </Link>
            <Link
              href="/admin/package-library"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-hub-muted"
            >
              Package Library
            </Link>
            <Link
              href={
                first ? `/admin/clients/${first.id}/apps/search-board/install` : "/admin/clients"
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-hub-muted"
            >
              Search Board install
            </Link>
          </>
        ) : null}
        <Link
          href="/portal"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-hub-muted"
        >
          Client home
        </Link>
      </div>

      {isPlatformAdmin && overview ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Client accounts
            </h3>
            <AdminClientsOverviewTable rows={overview} />
          </section>
          <aside>
            <AddClientAccountForm />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold text-hub-bar sm:text-xl">{value}</p>
    </div>
  );
}
