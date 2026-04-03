import Link from "next/link";

import { ManualPackageBuilderClient } from "@/src/components/admin/manual-package-builder-client";
import { listManualPackageDraftsAction } from "@/src/lib/platform/actions/manual-package-draft";

export default async function AdminPackageBuilderPage() {
  const drafts = await listManualPackageDraftsAction();

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-xs text-slate-500">
          <Link href="/admin/package-library" className="text-hub-ink hover:underline">
            Package Library
          </Link>
          <span className="text-slate-400"> · </span>
          Package Builder
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-hub-bar">Manual package builder</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose a source portal ID and assemble a manifest of HubSpot resource types. Save drafts,
          then publish to the library without the browser extension.
        </p>
      </header>

      <ManualPackageBuilderClient initialDrafts={drafts} />
    </div>
  );
}
