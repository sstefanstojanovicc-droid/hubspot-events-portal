import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";

type PageProps = { params: Promise<{ slug: string }> };

/** Placeholder asset keys — real builder will read from HubSpot sync index. */
const MOCK_SYNCED_ASSETS = [
  { id: "wf-1", kind: "Workflow", label: "Lead routing — executive search" },
  { id: "em-1", kind: "Email", label: "Shortlist notification template" },
  { id: "co-1", kind: "Custom object", label: "Candidate (Search Board)" },
  { id: "list-1", kind: "List", label: "Active shortlists this quarter" },
  { id: "form-1", kind: "Form", label: "Client feedback capture" },
];

export default async function PackageBuilderPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs text-slate-500">
          <Link href={`/clients/${client.slug}/packages`} className="text-hub-ink hover:underline">
            Packages
          </Link>
          <span className="text-slate-400"> · </span>
          Builder
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-hub-bar">Package builder</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Draft a versioned bundle of HubSpot assets from a source portal. This screen is a scaffold:
          wire HubSpot metadata and persistence next.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
        <h2 className="text-sm font-semibold text-slate-900">Source</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose which portal / client workspace supplies the canonical objects.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Source client
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              defaultValue={client.id}
              disabled
              title="Placeholder — will list tenants you can package from"
            >
              <option value={client.id}>{client.name}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            HubSpot portal ID
            <input
              readOnly
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm"
              value={client.hubspotPortalId}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Synced assets (sample)</h2>
        <p className="mt-1 text-xs text-slate-500">
          When sync is connected, this list will reflect CRM objects, workflows, and content from
          HubSpot.
        </p>
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
          {MOCK_SYNCED_ASSETS.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{a.label}</p>
                <p className="text-xs text-slate-500">
                  {a.kind} · <span className="font-mono">{a.id}</span>
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name={`asset-${a.id}`} className="rounded border-slate-300" />
                Include
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <button
          type="button"
          disabled
          className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
          title="Coming soon"
        >
          Save package draft
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500"
          title="Coming soon"
        >
          Version package (e.g. 1.0.0)
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500"
          title="Coming soon"
        >
          Install package (placeholder)
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500"
          title="Coming soon"
        >
          Deploy package (placeholder)
        </button>
      </section>

      <p className="text-xs text-slate-500">
        Install and deploy will call the same pipeline as{" "}
        <Link href="/admin/package-library" className="font-medium text-hub-ink hover:underline">
          admin package library
        </Link>{" "}
        once wired.
      </p>

      <Link
        href={`/clients/${client.slug}/packages`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← Installed packages
      </Link>
    </div>
  );
}
