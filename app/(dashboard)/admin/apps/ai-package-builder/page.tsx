import Link from "next/link";

export default function AiPackageBuilderAppPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Apps</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-hub-bar">AI Package Builder</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Compose and version AI-assisted package definitions from implementation patterns. This app
          will connect to package schemas and publishing; shell only for now.
        </p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
        <p className="text-sm text-slate-600">
          Builder tooling and templates will land here. Use{" "}
          <Link href="/admin/packages/builder" className="font-semibold text-hub-ink hover:underline">
            platform Package Builder
          </Link>{" "}
          for HubSpot-asset style packages today.
        </p>
      </div>
    </div>
  );
}
