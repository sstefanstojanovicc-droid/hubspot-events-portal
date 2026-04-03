import Link from "next/link";

import { getClientAppMapping } from "@/src/lib/platform/client-app-mapping-store";
import { getClientHubSpotLinkRecord } from "@/src/lib/platform/client-connection-store";
import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import { getEffectiveConnectionStatusAsync } from "@/src/lib/platform/effective-client";
import { getClientAccountById } from "@/src/lib/platform/client-accounts-repo";
import { introspectHubSpotAccessToken } from "@/src/lib/hubspot/connection";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import { ensureSearchBoardMappingHydrated } from "@/src/lib/search-board/search-board-hydration";

export default async function AdminDiagnosticsPage() {
  const clientId = await getWorkspaceClientId();
  const client = await getClientAccountById(clientId);

  await ensureSearchBoardMappingHydrated(clientId);
  const mapping = getClientAppMapping(clientId, "search_board");
  const link = getClientHubSpotLinkRecord(clientId);
  const tokenOk = isHubSpotAccessTokenConfigured();
  const intro = tokenOk ? await introspectHubSpotAccessToken() : null;
  const effectiveStatus = client ? await getEffectiveConnectionStatusAsync(client) : null;

  const objectTypeIds = mapping
    ? {
        candidate: mapping.hubspot.objects.candidate?.objectTypeId ?? "—",
        shortlist: mapping.hubspot.objects.shortlist?.objectTypeId ?? "—",
        shortlist_entry: mapping.hubspot.objects.shortlist_entry?.objectTypeId ?? "—",
      }
    : null;

  const associationTypeIds = mapping?.hubspot.associationTypeIds ?? null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-slate-500">
          <Link href="/dashboard" className="text-hub-ink hover:text-hub-bar">
            Dashboard
          </Link>
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-hub-bar">Status</h2>
      </header>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <h3 className="font-semibold text-slate-900">Tenant</h3>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <Row label="Workspace client id" value={clientId} />
          <Row
            label="Client name"
            value={client ? client.name : "— (unknown id)"}
          />
          <Row
            label="Portal id (client record)"
            value={client?.hubspotPortalId ?? "—"}
          />
          <Row
            label="Token introspection portal"
            value={
              !tokenOk
                ? "— (no token)"
                : intro?.ok
                  ? intro.portalId
                  : `Error: ${intro?.message ?? "?"}`
            }
          />
          <Row label="Effective connection status" value={effectiveStatus ?? "—"} />
          <Row
            label="In-memory link record"
            value={link ? `${link.status} (portal match: ${link.portalMatchesClientRecord})` : "none"}
          />
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <h3 className="font-semibold text-slate-900">Search Board mapping row</h3>
        <dl className="mt-3 grid gap-2">
          <Row label="Mapping row present" value={mapping ? "yes" : "no"} />
          {mapping ? (
            <Row label="Updated at" value={mapping.updatedAt} />
          ) : null}
        </dl>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Object type IDs
        </p>
        <pre className="mt-1 overflow-x-auto rounded border border-slate-200 bg-white p-3 text-xs text-slate-800">
          {JSON.stringify(objectTypeIds, null, 2)}
        </pre>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Association type IDs
        </p>
        <pre className="mt-1 overflow-x-auto rounded border border-slate-200 bg-white p-3 text-xs text-slate-800">
          {JSON.stringify(associationTypeIds, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-mono text-xs text-slate-900">{value}</dd>
    </div>
  );
}
