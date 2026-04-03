import Link from "next/link";
import { notFound } from "next/navigation";

import { PackageLibraryDeleteButton } from "@/src/components/admin/package-library-delete-button";
import { PackageVersionPlanView } from "@/src/components/admin/package-version-plan-view";
import { getPackageDefinitionById } from "@/src/lib/workspace/packages-repo";

type PageProps = { params: Promise<{ packageId: string }> };

export default async function AdminPackageDetailPage({ params }: PageProps) {
  const { packageId } = await params;
  const pkg = await getPackageDefinitionById(packageId);
  if (!pkg) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm">
        <Link href="/admin/package-library" className="font-medium text-hub-ink hover:underline">
          ← Package library
        </Link>
      </nav>

      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Package</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-hub-bar">{pkg.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {pkg.description || "No description."}
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
            {pkg.sourceHubspotPortalId ? (
              <div>
                <dt className="font-medium text-slate-500">Portal ID</dt>
                <dd className="font-mono text-slate-800">{pkg.sourceHubspotPortalId}</dd>
              </div>
            ) : null}
            {pkg.clientAccount ? (
              <div>
                <dt className="font-medium text-slate-500">Originating client</dt>
                <dd>
                  <Link
                    href={`/admin/apps/hubspot-ai-implementation/${pkg.clientAccount.slug}/packages`}
                    className="font-medium text-hub-ink hover:underline"
                  >
                    {pkg.clientAccount.name}
                  </Link>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium text-slate-500">Definition ID</dt>
              <dd className="font-mono text-slate-500">{pkg.id}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/package-library/${pkg.id}/edit`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Edit
          </Link>
          <PackageLibraryDeleteButton packageId={pkg.id} packageName={pkg.name} />
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Versions & contents</h2>
        <p className="mt-1 text-xs text-slate-600">
          Plans open as overview, data model, workflows, and flow — raw notes stay in the folded section for export.
        </p>
        <ul className="mt-4 space-y-4">
          {pkg.versions.map((v) => (
            <li
              key={v.id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-hub-bar">{v.versionLabel}</span>
                <span className="text-[10px] text-slate-500">
                  {v.createdAt.toLocaleString()} · <span className="font-mono">{v.id}</span>
                </span>
              </div>
              <div className="mt-3">
                <PackageVersionPlanView notes={v.notes ?? ""} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
