import Link from "next/link";
import { hubspotClient } from "@/src/lib/hubspot/client";
import { clientAccounts } from "@/src/lib/platform/mock-data";

export default function DashboardPage() {
  const status = hubspotClient.getStatus();
  const client = clientAccounts[0];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Platform dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">
          Search Board is the first live app. Connect the Anicca dev tenant to HubSpot portal{" "}
          <span className="font-mono text-slate-800">{client?.hubspotPortalId}</span>, then run
          provisioning.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Dev client accounts" value={String(clientAccounts.length)} />
        <StatCard
          label="HubSpot private app token"
          value={status.hasToken ? "Loaded (server)" : "Not set"}
        />
        <StatCard label="Primary app" value="Search Board" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Next steps</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <Link href="/admin/clients" className="text-indigo-700 hover:text-indigo-900">
              Open Client accounts
            </Link>{" "}
            and connect HubSpot for the dev tenant.
          </li>
          <li>
            <Link
              href={`/admin/clients/${client?.id}/apps/search-board/install`}
              className="text-indigo-700 hover:text-indigo-900"
            >
              Search Board install
            </Link>{" "}
            — dry-run diff, live HubSpot provisioning, and platform mapping.
          </li>
          <li>
            Use the header switcher to preview{" "}
            <Link href="/portal" className="text-indigo-700 hover:text-indigo-900">
              Client view
            </Link>
            .
          </li>
        </ul>
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
