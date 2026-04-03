import Link from "next/link";
import { notFound } from "next/navigation";

import { PackageLibraryDeleteButton } from "@/src/components/admin/package-library-delete-button";
import {
  updatePackageMetaFormAction,
  updatePackageVersionFormAction,
} from "@/src/lib/platform/actions/package-library-actions";
import { getPackageDefinitionById } from "@/src/lib/workspace/packages-repo";

type PageProps = { params: Promise<{ packageId: string }> };

export default async function AdminPackageEditPage({ params }: PageProps) {
  const { packageId } = await params;
  const pkg = await getPackageDefinitionById(packageId);
  if (!pkg) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm">
        <Link href={`/admin/package-library/${pkg.id}`} className="font-medium text-hub-ink hover:underline">
          ← {pkg.name}
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold text-hub-bar">Edit package</h1>
        <p className="mt-1 text-sm text-slate-600">Name, description, portal ID, and version notes.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Definition</h2>
        <form action={updatePackageMetaFormAction} className="mt-4 space-y-4">
          <input type="hidden" name="packageId" value={pkg.id} />
          <label className="block text-xs font-medium text-slate-600">
            Name
            <input
              name="name"
              required
              defaultValue={pkg.name}
              className="mt-1 w-full max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Description
            <textarea
              name="description"
              rows={3}
              defaultValue={pkg.description}
              className="mt-1 w-full max-w-2xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Source HubSpot portal ID
            <input
              name="sourceHubspotPortalId"
              defaultValue={pkg.sourceHubspotPortalId ?? ""}
              className="mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="Optional"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Save definition
          </button>
        </form>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-slate-900">Versions</h2>
        {pkg.versions.map((v) => (
          <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <form action={updatePackageVersionFormAction} className="space-y-3">
              <input type="hidden" name="packageId" value={pkg.id} />
              <input type="hidden" name="versionId" value={v.id} />
              <label className="block text-xs font-medium text-slate-600">
                Version label
                <input
                  name="versionLabel"
                  required
                  defaultValue={v.versionLabel}
                  className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Notes / contents
                <textarea
                  name="notes"
                  rows={16}
                  defaultValue={v.notes}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-xs leading-relaxed text-slate-800"
                />
              </label>
              <p className="font-mono text-[10px] text-slate-400">Version id: {v.id}</p>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Save this version
              </button>
            </form>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
        <PackageLibraryDeleteButton packageId={pkg.id} packageName={pkg.name} />
      </div>
    </div>
  );
}
