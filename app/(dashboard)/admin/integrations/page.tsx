import Link from "next/link";

export default function AdminIntegrationsPage() {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
      : "") ||
    "http://localhost:3000";
  const webhook = `${origin}/api/fathom/webhook`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-hub-bar">Integrations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect external systems to HubSpot Operations Platform. Configure secrets in environment variables.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
        <h3 className="text-sm font-semibold text-slate-900">Fathom (webhook)</h3>
        <p className="mt-2 text-sm text-slate-600">
          POST JSON to register a call. Optional header{" "}
          <code className="rounded bg-white px-1 text-xs">Authorization: Bearer $FATHOM_WEBHOOK_SECRET</code>{" "}
          when <code className="text-xs">FATHOM_WEBHOOK_SECRET</code> is set.
        </p>
        <p className="mt-3 break-all font-mono text-xs text-slate-800">{webhook}</p>
        <p className="mt-3 text-xs text-slate-500">
          Body fields: <code className="text-xs">clientAccountId</code> (required),{" "}
          <code className="text-xs">title</code>, <code className="text-xs">callAt</code> (ISO),{" "}
          <code className="text-xs">transcript</code>, <code className="text-xs">attendees</code>{" "}
          (string array).
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">HubSpot</h3>
        <p className="mt-2 text-sm text-slate-600">
          Private app token and Search Board install live under each client in the admin area.
        </p>
        <Link
          href="/admin/clients"
          className="mt-3 inline-block text-sm font-semibold text-hub-ink hover:underline"
        >
          Open clients →
        </Link>
      </section>

      <Link href="/dashboard" className="text-sm font-semibold text-hub-ink hover:underline">
        ← Dashboard
      </Link>
    </div>
  );
}
