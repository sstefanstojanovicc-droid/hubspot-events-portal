import Link from "next/link";
import { hubspotClient } from "@/src/lib/hubspot/client";
import {
  appDefinitions,
  clientAccounts,
  getMockCurrentPlatformAdmin,
} from "@/src/lib/platform/mock-data";

export default function AdminPage() {
  const admin = getMockCurrentPlatformAdmin();
  const token = hubspotClient.getStatus().hasToken;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Platform Admin</h2>
        <p className="mt-2 text-sm text-slate-600">
          Manage dev tenant HubSpot connection and Search Board provisioning.
        </p>
        {admin ? (
          <p className="mt-2 text-xs text-slate-500">
            Dev operator: {admin.name} ({admin.email})
          </p>
        ) : null}
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Client accounts" value={String(clientAccounts.length)} />
        <StatCard label="Apps" value={String(appDefinitions.length)} />
        <StatCard
          label="HubSpot token (server)"
          value={token ? "Configured" : "Not set"}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <QuickLink
          href="/admin/clients"
          title="Client accounts"
          description="Anicca Dev Test Account — connect HubSpot and open app installs."
        />
        <QuickLink
          href="/admin/apps"
          title="Apps"
          description="Search Board plus placeholder modules (Events, Calendar, and more)."
        />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </Link>
  );
}
