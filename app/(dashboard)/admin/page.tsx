import Link from "next/link";
import { hubspotClient } from "@/src/lib/hubspot/client";
import { appDefinitions, clientAccounts } from "@/src/lib/platform/mock-data";

export default function AdminPage() {
  const token = hubspotClient.getStatus().hasToken;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-hub-bar">Admin</h2>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Clients" value={String(clientAccounts.length)} />
        <StatCard label="Apps" value={String(appDefinitions.length)} />
        <StatCard label="HubSpot API" value={token ? "Ready" : "Off"} />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <QuickLink href="/admin/clients" title="Clients" />
        <QuickLink href="/admin/apps" title="Apps" />
      </section>
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

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 font-semibold text-hub-bar shadow-sm transition hover:border-hub-muted"
    >
      {title}
    </Link>
  );
}
