import Link from "next/link";
import { notFound } from "next/navigation";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { runFathomExtractionStubFormAction } from "@/src/lib/workspace/actions/workspace-actions";
import { getFathomCallById } from "@/src/lib/workspace/fathom-repo";

type PageProps = { params: Promise<{ slug: string; callId: string }> };

export default async function FathomCallDetailPage({ params }: PageProps) {
  const { slug, callId } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const call = await getFathomCallById(callId, client.id);

  if (!call) {
    notFound();
  }

  let attendees: string[] = [];
  try {
    attendees = JSON.parse(call.attendeesJson) as string[];
    if (!Array.isArray(attendees)) {
      attendees = [];
    }
  } catch {
    attendees = [];
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link
          href={`/clients/${client.slug}/fathom-calls`}
          className="font-medium text-hub-ink hover:underline"
        >
          ← Fathom Calls
        </Link>
      </nav>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Call</p>
        <h1 className="text-2xl font-semibold text-hub-bar">{call.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {call.callAt.toLocaleString()} · Extraction:{" "}
          <span className="font-medium">{call.extractionStatus}</span>
        </p>
      </header>

      {attendees.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-800">Participants</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
            {attendees.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {call.summary ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-800">Summary / extraction</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{call.summary}</p>
        </section>
      ) : null}

      {call.transcript ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-800">Transcript</h2>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 whitespace-pre-wrap">
            {call.transcript}
          </pre>
        </section>
      ) : (
        <p className="text-sm text-slate-500">No transcript stored.</p>
      )}

      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-semibold text-slate-800">AI extraction (stub)</h2>
        <p className="mt-1 text-xs text-slate-600">
          Placeholder pipeline — replaces with real model + queue later.
        </p>
        <form action={runFathomExtractionStubFormAction} className="mt-3">
          <input type="hidden" name="clientAccountId" value={client.id} />
          <input type="hidden" name="clientSlug" value={client.slug} />
          <input type="hidden" name="callId" value={call.id} />
          <button
            type="submit"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Run stub extraction
          </button>
        </form>
      </section>
    </div>
  );
}
