import Link from "next/link";

export default function AdminCreatePackagePage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-xs text-slate-500">
          <Link href="/admin/package-library" className="text-hub-ink hover:underline">
            Package Library
          </Link>
          <span className="text-slate-400"> · </span>
          Create Package
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-hub-bar">Create package</h1>
        <p className="mt-1 text-sm text-slate-600">
          Define a new versioned package record before attaching HubSpot assets or implementation
          outputs.
        </p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
        <p className="text-sm text-slate-600">
          Creation form and validation will be added here. For now, manage versions from the{" "}
          <Link href="/admin/package-library" className="font-semibold text-hub-ink hover:underline">
            library
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
