import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { listInstallationsForClient } from "@/src/lib/workspace/packages-repo";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientPackagesPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const installations = await listInstallationsForClient(client.id);

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Packages</p>
            <h1 className="text-2xl font-semibold text-hub-bar">Packages</h1>
            <p className="mt-1 text-sm text-slate-600">
              Versioned HubSpot asset bundles. Admins install from the{" "}
              <Link href="/admin/package-library" className="font-semibold text-hub-ink hover:underline">
                package library
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/clients/${client.slug}/packages/builder`}
              className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
            >
              Package builder
            </Link>
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
              title="Coming soon"
            >
              Install package
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
              title="Coming soon"
            >
              Deploy package
            </button>
          </div>
        </div>
      </header>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Installed on this workspace
        </h2>
        {installations.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
            <p className="text-sm font-medium text-slate-800">No packages installed yet</p>
            <p className="mt-1 text-sm text-slate-600">
              When your partner publishes a version to this tenant, it will show here. Use the
              builder to prepare drafts (scaffold).
            </p>
            <Link
              href={`/clients/${client.slug}/packages/builder`}
              className="mt-4 inline-block text-sm font-semibold text-hub-ink hover:underline"
            >
              Open package builder →
            </Link>
          </div>
        ) : (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {installations.map((ins) => (
            <li key={ins.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link
                    href={`/clients/${client.slug}/packages/${ins.version.package.id}`}
                    className="font-semibold text-hub-ink hover:underline"
                  >
                    {ins.version.package.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    v{ins.version.versionLabel} · {ins.status} ·{" "}
                    {ins.deployedAt.toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">
                  {ins.status}
                </span>
              </div>
              {ins.version.notes ? (
                <p className="mt-2 text-sm text-slate-600">{ins.version.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
        )}
      </div>

      <Link
        href={`/clients/${client.slug}`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← Workspace
      </Link>
    </div>
  );
}
