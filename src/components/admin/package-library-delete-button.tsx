"use client";

import { deletePackageFormAction } from "@/src/lib/platform/actions/package-library-actions";

export function PackageLibraryDeleteButton({
  packageId,
  packageName,
}: {
  packageId: string;
  packageName: string;
}) {
  return (
    <form action={deletePackageFormAction} className="inline">
      <input type="hidden" name="packageId" value={packageId} />
      <button
        type="submit"
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
        onClick={(e) => {
          if (
            !confirm(
              `Delete “${packageName}”? All versions and their installation records will be removed.`,
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}
