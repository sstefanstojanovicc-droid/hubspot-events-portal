import Link from "next/link";
import { hubspotClient } from "@/src/lib/hubspot/client";
import { clientAccounts } from "@/src/lib/platform/mock-data";

export default function DashboardPage() {
  const status = hubspotClient.getStatus();
  const first = clientAccounts[0];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-hub-bar">Dashboard</h2>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Clients" value={String(clientAccounts.length)} />
        <StatCard
          label="HubSpot API"
          value={status.hasToken ? "Ready" : "Not configured"}
        />
        <StatCard label="Search Board" value="Active" />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/clients"
          className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
        >
          Clients
        </Link>
        <Link
          href={first ? `/admin/clients/${first.id}/apps/search-board/install` : "/admin/clients"}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-hub-muted"
        >
          Search Board setup
        </Link>
        <Link
          href="/portal"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-hub-muted"
        >
          Client home
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-hub-bar">{value}</p>
    </div>
  );
}
