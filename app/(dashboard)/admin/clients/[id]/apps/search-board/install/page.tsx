import Link from "next/link";
import { notFound } from "next/navigation";
import { ConnectHubSpotForm } from "@/src/components/platform/connect-hubspot-form";
import { RunSearchBoardInstallForm } from "@/src/components/platform/run-search-board-install-form";
import { getClientAppMapping } from "@/src/lib/platform/client-app-mapping-store";
import {
  getEffectiveConnectionStatusAsync,
} from "@/src/lib/platform/effective-client";
import { ensureSearchBoardMappingHydrated } from "@/src/lib/search-board/search-board-hydration";
import { getClientById } from "@/src/lib/platform/mock-data";
import { buildDryRunInstallPlan } from "@/src/lib/provisioning/provisioning-service";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";

interface SearchBoardInstallPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notify?: string | string[] }>;
}

function installPipelineLabels(args: {
  platformConnected: boolean;
  snapshotOk: boolean;
  lastReport?: { ok: boolean; failedStep?: string };
  mappingPresent: boolean;
}) {
  const { platformConnected, snapshotOk, lastReport, mappingPresent } = args;
  const connected = platformConnected ? "Connected" : "Not connected";
  const snapshot = !platformConnected
    ? "—"
    : snapshotOk
      ? "Snapshot available"
      : "Snapshot error";
  const progress =
    lastReport?.ok === false
      ? `Failed (${lastReport.failedStep ?? "error"})`
      : lastReport?.ok
        ? "Complete"
        : mappingPresent
          ? "Ready / last run on record"
          : "Not started";
  const complete =
    lastReport?.ok ? "Yes" : lastReport?.ok === false ? "Partial / failed" : mappingPresent ? "Mapping on file" : "—";
  return { connected, snapshot, progress, complete };
}

export default async function SearchBoardInstallPage({
  params,
  searchParams,
}: SearchBoardInstallPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const notifyRaw = sp.notify;
  const notify = Array.isArray(notifyRaw) ? notifyRaw[0] : notifyRaw;

  const client = getClientById(id);

  if (!client) {
    notFound();
  }

  const tokenConfigured = isHubSpotAccessTokenConfigured();
  await ensureSearchBoardMappingHydrated(client.id);
  const platformConnected = (await getEffectiveConnectionStatusAsync(client)) === "connected";
  const plan = await buildDryRunInstallPlan(client.id, "search-board");
  const persisted = getClientAppMapping(client.id, "search_board");

  const missingObjects = plan.objects.filter((o) => o.status === "missing").length;
  const missingProps = plan.properties.filter(
    (p) => p.status === "missing" || p.status === "partial",
  ).length;
  const missingAssoc = plan.associations.filter(
    (a) => a.status === "missing" || a.status === "unknown",
  ).length;

  const lastReport = persisted?.lastInstallReport;
  const pipeline = installPipelineLabels({
    platformConnected,
    snapshotOk: plan.hubspotSnapshotAvailable,
    lastReport,
    mappingPresent: Boolean(persisted),
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-slate-500">
          <Link href="/admin/clients" className="text-hub-ink hover:text-hub-bar">
            Client accounts
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <Link
            href={`/admin/clients/${client.id}`}
            className="text-hub-ink hover:text-hub-bar"
          >
            {client.name}
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="text-slate-600">Search Board setup</span>
        </div>
        <h2 className="text-2xl font-semibold text-hub-bar">Search Board setup</h2>
        <p className="text-sm text-slate-600">
          <strong className="text-hub-ink">One-time per portal:</strong> creates Search Board custom
          objects in HubSpot if missing. The app keeps object and mapping data in sync when you use
          Search Board after this — you are not expected to rerun setup unless HubSpot schemas change.
        </p>
        <p className="text-xs text-slate-500">
          Tables below are read-only diffs. Use <strong>Run setup</strong> to apply changes in HubSpot.
        </p>
      </header>

      {notify === "hub-connected" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Connected. You can run setup below.
        </p>
      ) : null}
      {notify === "install-complete" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Setup finished. See <strong>Last run</strong> for details.
        </p>
      ) : null}

      {!platformConnected ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-950">Connect HubSpot first</h3>
          <p className="mt-2 text-sm text-amber-900">
            Token must match portal{" "}
            <span className="font-mono">{client.hubspotPortalId}</span>.
          </p>
          <div className="mt-4">
            <ConnectHubSpotForm clientId={client.id} afterSuccess="redirect-install" />
          </div>
          <p className="mt-3 text-xs text-amber-800">
            <Link href={`/admin/clients/${client.id}`} className="font-semibold underline">
              Open client account →
            </Link>
          </p>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Status</h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              1. Connected
            </dt>
            <dd className="mt-1 font-medium text-slate-900">{pipeline.connected}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              2. Schema snapshot
            </dt>
            <dd className="mt-1 font-medium text-slate-900">{pipeline.snapshot}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              3. Last HubSpot run
            </dt>
            <dd className="mt-1 font-medium text-slate-900">{pipeline.progress}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              4. Mapping / complete
            </dt>
            <dd className="mt-1 font-medium text-slate-900">{pipeline.complete}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Platform mapping row
            </dt>
            <dd className="mt-1 font-medium text-slate-900">
              {persisted ? `Saved — ${persisted.updatedAt}` : "Not yet"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Private app token (server)
            </dt>
            <dd className="mt-1 font-medium text-slate-900">
              {tokenConfigured ? "Configured" : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Client portal id (record)
            </dt>
            <dd className="mt-1 font-medium text-slate-900">{client.hubspotPortalId}</dd>
          </div>
        </dl>
        {plan.hubspotSnapshotError ? (
          <p className="mt-3 text-xs text-rose-700">{plan.hubspotSnapshotError}</p>
        ) : null}
        {lastReport && !lastReport.ok ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-950">
            Last install ended with an error at <code>{lastReport.failedStep}</code>. Fix the HubSpot
            issue and run install again — completed steps are skipped automatically.
          </p>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard label="Blueprint" value={plan.blueprint.displayName} sub={plan.blueprint.version} />
        <SummaryCard
          label="Gaps"
          value={`${missingObjects} objects · ${missingProps} props · ${missingAssoc} assoc.`}
        />
        <SummaryCard
          label="Proposed actions (dry-run diff)"
          value={String(plan.proposedActions.length)}
          sub="Compared to current HubSpot schema"
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Blueprint — required custom objects
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {plan.blueprint.customObjects.map((o) => (
            <li key={o.objectKey} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
              <span>
                <span className="font-medium text-slate-900">{o.pluralLabel}</span>{" "}
                <code className="text-xs text-slate-600">{o.schemaName}</code>
              </span>
              <span className="text-xs text-slate-500">
                {o.requiredProperties.length} properties
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Objects — actual vs blueprint
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold text-slate-700">Object</th>
                <th className="px-3 py-2 font-semibold text-slate-700">Status</th>
                <th className="px-3 py-2 font-semibold text-slate-700">HubSpot type id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plan.objects.map((row) => (
                <tr key={row.blueprintObjectKey}>
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-900">{row.singularLabel}</span>
                    <div className="text-xs text-slate-500">{row.schemaName}</div>
                  </td>
                  <td className="px-3 py-2 capitalize text-slate-800">{row.status}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">
                    {row.hubspotObjectTypeId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Properties — missing or mismatched
        </h3>
        <div className="mt-3 max-h-72 overflow-y-auto overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold text-slate-700">Object</th>
                <th className="px-3 py-2 font-semibold text-slate-700">Property</th>
                <th className="px-3 py-2 font-semibold text-slate-700">Status</th>
                <th className="px-3 py-2 font-semibold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plan.properties.map((row) => (
                <tr key={`${row.blueprintObjectKey}.${row.propertyName}`}>
                  <td className="px-3 py-2 text-slate-800">{row.blueprintObjectKey}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.propertyName}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {row.detail ??
                      (row.actualValueType
                        ? `${row.actualValueType} / ${row.actualFieldType ?? ""}`
                        : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Associations
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold text-slate-700">Id</th>
                <th className="px-3 py-2 font-semibold text-slate-700">Between</th>
                <th className="px-3 py-2 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plan.associations.map((row) => (
                <tr key={row.associationId}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.associationId}</td>
                  <td className="px-3 py-2 text-slate-800">
                    {row.fromLabel} → {row.toLabel}
                    {row.description ? (
                      <div className="text-xs text-slate-500">{row.description}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Validations
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {plan.validations.map((v) => (
            <li key={v.checkId} className="flex gap-2">
              <span className={v.passed ? "text-emerald-700" : "text-rose-700"}>
                {v.passed ? "✓" : "✗"}
              </span>
              <span className="text-slate-800">{v.description}</span>
              {v.message ? (
                <span className="text-xs text-slate-500">— {v.message}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Dry-run install plan (proposed actions)
        </h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {plan.proposedActions.map((a, index) => (
            <li key={`${a.kind}-${index}`}>
              <code className="text-xs">{a.kind}</code>{" "}
              {a.kind === "create_custom_object_schema" ? (
                <span>{a.schemaName}</span>
              ) : a.kind === "create_property" ? (
                <span>
                  {a.objectTypeTarget}.{a.property}
                </span>
              ) : a.kind === "create_association" ? (
                <span>{a.associationId}</span>
              ) : (
                <span>{a.title}</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Mapping preview (platform keys)
        </h3>
        <p className="mt-2 text-xs text-slate-600">
          Values populate from HubSpot when schemas exist; persisted keys override preview after
          install.
        </p>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          {Object.entries(plan.mappingPreview).map(([key, val]) => (
            <div key={key} className="rounded border border-slate-200 bg-white p-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {key}
              </dt>
              <dd className="mt-1 font-mono text-xs text-slate-900">{val ?? "null"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Run setup</h3>
        <p className="mt-2 text-sm text-slate-600">
          Creates missing schemas in HubSpot (safe to repeat). Refreshes mapping used by the app.
        </p>
        <div className="mt-4">
          <RunSearchBoardInstallForm
            clientId={client.id}
            disabled={!platformConnected}
            disabledReason={
              !platformConnected
                ? "Connect HubSpot for this client before capturing schema into the platform."
                : undefined
            }
          />
        </div>
      </section>

      {persisted ? (
        <section className="space-y-4">
          {lastReport ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Last run
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                {lastReport.ok ? "Succeeded" : "Failed"} ·{" "}
                {new Date(lastReport.finishedAt).toLocaleString()} · step{" "}
                <code className="text-[11px]">{lastReport.failedStep ?? "—"}</code>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded border border-slate-100 bg-slate-50 p-2">
                  <dt className="font-medium text-slate-500">Schemas + / skip</dt>
                  <dd className="font-mono text-slate-900">
                    {lastReport.counts.schemasCreated} / {lastReport.counts.schemasSkipped}
                  </dd>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 p-2">
                  <dt className="font-medium text-slate-500">Groups + / skip</dt>
                  <dd className="font-mono text-slate-900">
                    {lastReport.counts.groupsCreated} / {lastReport.counts.groupsSkipped}
                  </dd>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 p-2">
                  <dt className="font-medium text-slate-500">Props + / skip</dt>
                  <dd className="font-mono text-slate-900">
                    {lastReport.counts.propertiesCreated} / {lastReport.counts.propertiesSkipped}
                  </dd>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 p-2">
                  <dt className="font-medium text-slate-500">Assoc + / skip</dt>
                  <dd className="font-mono text-slate-900">
                    {lastReport.counts.associationsCreated} / {lastReport.counts.associationsSkipped}
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Object type IDs (returned)
                </p>
                <dl className="mt-1 grid grid-cols-1 gap-1 font-mono text-xs text-slate-800 sm:grid-cols-3">
                  {Object.entries(lastReport.objectTypeIds).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-500">{k}:</span> {v}
                    </div>
                  ))}
                </dl>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-slate-700">
                  Full install log
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-800">
                  {lastReport.log.join("\n")}
                </pre>
              </details>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Persisted platform mapping
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              Blueprint {persisted.blueprintId} v{persisted.blueprintVersion}
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {Object.entries(persisted.mappingKeyValues).map(([k, v]) => (
                <div key={k} className="rounded border border-slate-200 bg-white p-2">
                  <dt className="text-[10px] font-semibold uppercase text-slate-500">{k}</dt>
                  <dd className="mt-1 font-mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-600">{sub}</p> : null}
    </div>
  );
}
