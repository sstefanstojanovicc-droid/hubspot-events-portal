import Link from "next/link";

export default function AdminPlatformSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-hub-bar">Platform settings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Operator-level defaults and platform appearance.
        </p>
      </header>

      <ul className="space-y-3 text-sm text-slate-700">
        <li>
          <span className="font-semibold">Auth</span> — Google OAuth and invite flow via Auth.js
          env vars.
        </li>
        <li>
          <span className="font-semibold">Database</span> —{" "}
          <code className="text-xs">DATABASE_URL</code> (SQLite locally; Postgres recommended in
          production).
        </li>
        <li>
          <span className="font-semibold">HubSpot API</span> —{" "}
          <code className="text-xs">HUBSPOT_ACCESS_TOKEN</code> on the server.
        </li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/settings/branding"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Branding
        </Link>
        <Link
          href="/admin/templates"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Templates
        </Link>
        <Link
          href="/admin/diagnostics"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Diagnostics
        </Link>
        <Link
          href="/admin/integrations"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Integrations
        </Link>
      </div>
    </div>
  );
}
