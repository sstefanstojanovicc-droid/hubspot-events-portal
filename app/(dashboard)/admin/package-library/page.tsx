import Link from "next/link";

import { PackageLibraryDeleteButton } from "@/src/components/admin/package-library-delete-button";
import { listClientAccounts } from "@/src/lib/platform/client-accounts-repo";
import { installPackageToClientFormAction } from "@/src/lib/workspace/actions/workspace-actions";
import { listPackageDefinitions } from "@/src/lib/workspace/packages-repo";

export default async function AdminPackageLibraryPage() {
  const [packages, clients] = await Promise.all([
    listPackageDefinitions(),
    listClientAccounts(),
  ]);

  const versionOptions = packages.flatMap((p) =>
    p.versions.map((v) => ({
      id: v.id,
      label: `${p.name} @ ${v.versionLabel}`,
    })),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-slate-500">Packages</p>
          <h2 className="text-2xl font-semibold text-hub-bar">Package library</h2>
          <p className="mt-1 text-sm text-slate-600">
            Versioned bundles. Install onto a client workspace to surface under Packages in their hub.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/packages/create"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Create package
          </Link>
          <Link
            href="/admin/packages/builder"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Package builder
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
        <h3 className="text-sm font-semibold text-slate-900">Install on client</h3>
        <form action={installPackageToClientFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-600">
            Client
            <select
              name="clientRef"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {clients.map((c) => (
                <option key={c.id} value={`${c.id}|${c.slug}`}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Package version
            <select
              name="packageVersionId"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {versionOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover sm:col-span-2"
          >
            Install
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Definitions</h3>
        <div className="mt-4 space-y-4">
          {packages.length === 0 ? (
            <p className="text-sm text-slate-600">No packages. Run database seed.</p>
          ) : (
            packages.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-black/[0.02]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900">{p.name}</h4>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-3">{p.description}</p>
                    <ul className="mt-3 space-y-1 text-xs text-slate-500">
                      {p.versions.map((v) => (
                        <li key={v.id} className="font-mono">
                          {v.versionLabel} · {v.id}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/admin/package-library/${p.id}`}
                      className="rounded-lg bg-hub px-3 py-1.5 text-xs font-semibold text-white hover:bg-hub-hover"
                    >
                      View contents
                    </Link>
                    <Link
                      href={`/admin/package-library/${p.id}/edit`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <PackageLibraryDeleteButton packageId={p.id} packageName={p.name} />
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <Link href="/admin/clients" className="text-sm font-semibold text-hub-ink hover:underline">
        ← Clients
      </Link>
    </div>
  );
}
