import Link from "next/link";
import { notFound } from "next/navigation";
import { AppTile } from "@/src/components/platform/app-tile";
import { ConnectHubSpotForm } from "@/src/components/platform/connect-hubspot-form";
import { getClientHubSpotLinkRecord } from "@/src/lib/platform/client-connection-store";
import {
  getEffectiveConnectionStatus,
  getInstalledAppsWithOverrides,
} from "@/src/lib/platform/effective-client";
import { getClientById } from "@/src/lib/platform/mock-data";

interface AdminClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClientDetailPage({
  params,
}: AdminClientDetailPageProps) {
  const { id } = await params;
  const client = getClientById(id);

  if (!client) {
    notFound();
  }

  const installs = getInstalledAppsWithOverrides(client.id);
  const effectiveStatus = getEffectiveConnectionStatus(client);
  const link = getClientHubSpotLinkRecord(client.id);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">{client.name}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tenant record, HubSpot connection, and installed apps.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <DetailRow label="Client name" value={client.name} />
        <DetailRow label="Slug" value={client.slug} />
        <DetailRow label="HubSpot portal ID" value={client.hubspotPortalId} />
        <DetailRow
          label="Connection status"
          value={effectiveStatus.replaceAll("_", " ")}
        />
        {link ? (
          <DetailRow
            label="Verified token portal (dev)"
            value={link.verifiedTokenPortalId || "—"}
          />
        ) : null}
      </section>

      {link && !link.portalMatchesClientRecord && link.verifiedTokenPortalId ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          Token portal <strong>{link.verifiedTokenPortalId}</strong> does not match this client
          record (<strong>{client.hubspotPortalId}</strong>). Update the token or the tenant
          record.
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Connect HubSpot (dev)</h3>
        <p className="mt-2 text-sm text-slate-600">
          Validates <code className="rounded bg-slate-100 px-1">HUBSPOT_ACCESS_TOKEN</code> on the
          server and checks the portal id matches this account. The token is never sent to the
          browser.
        </p>
        <div className="mt-4">
          <ConnectHubSpotForm clientId={client.id} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Installed apps
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {installs.map((install) => (
            <AppTile
              key={install.app.id}
              app={install.app}
              href={install.enabled ? install.app.route : undefined}
              badge={
                install.enabled
                  ? `status: ${install.mappingStatus.replaceAll("_", " ")}`
                  : "disabled"
              }
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Search Board provisioning</h3>
        <p className="mt-2 text-sm text-slate-600">
          Compare the HubSpot schema to the blueprint, run a dry-run, and capture mappings after
          connect.
        </p>
        <div className="mt-3">
          <Link
            href={`/admin/clients/${client.id}/apps/search-board/install`}
            className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Open Search Board install
          </Link>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
