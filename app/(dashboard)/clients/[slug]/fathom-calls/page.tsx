import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { createFathomCallFormAction } from "@/src/lib/workspace/actions/workspace-actions";
import { listFathomCallsForClient } from "@/src/lib/workspace/fathom-repo";

type PageProps = { params: Promise<{ slug: string }> };

export default async function FathomCallsPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const calls = await listFathomCallsForClient(client.id, 80);

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Fathom Calls
        </p>
        <h1 className="text-2xl font-semibold text-hub-bar">Calls &amp; extraction</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ingest transcripts via{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">POST /api/fathom/webhook</code> or add
          manually below.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Log a call manually</h2>
        <form action={createFathomCallFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="clientAccountId" value={client.id} />
          <input type="hidden" name="clientSlug" value={client.slug} />
          <label className="sm:col-span-2 block text-xs font-medium text-slate-600">
            Title
            <input
              name="title"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Call time
            <input
              type="datetime-local"
              name="callAt"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="sm:col-span-2 block text-xs font-medium text-slate-600">
            Transcript (optional)
            <textarea
              name="transcript"
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Save call
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent</h2>
        {calls.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No calls yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {calls.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <Link
                  href={`/clients/${client.slug}/fathom-calls/${c.id}`}
                  className="font-semibold text-hub-ink hover:underline"
                >
                  {c.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {c.callAt.toLocaleString()} · {c.extractionStatus} · {c.source}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href={`/clients/${client.slug}`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← Workspace
      </Link>
    </div>
  );
}
