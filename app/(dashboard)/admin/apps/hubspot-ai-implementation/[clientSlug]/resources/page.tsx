import Link from "next/link";

import {
  addClientImplementationResourceFormAction,
  deleteClientImplementationResourceFormAction,
  listImplementationResourcesForClientAction,
} from "@/src/lib/platform/actions/platform-implementation-resources";

const TYPE_OPTIONS = [
  "sow",
  "miro",
  "notes",
  "transcript",
  "fathom",
  "proposal",
  "requirements",
  "other",
] as const;

export default async function HubspotAiImplementationResourcesPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const resources = await listImplementationResourcesForClientAction(clientSlug);

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600 max-w-3xl">
        Resources here are stored only for this client account — SOWs, workshop notes, Miro links,
        transcripts, and uploads. They feed the{" "}
        <Link href={`/admin/apps/hubspot-ai-implementation/${clientSlug}/builder`} className="font-medium text-hub-ink underline">
          Builder
        </Link>{" "}
        for this client. Global HubSpot rules live in{" "}
        <Link href="/admin/apps/hubspot-ai-implementation/knowledge-base" className="font-medium text-hub-ink underline">
          HubSpot Knowledge Base
        </Link>
        .
      </p>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          action={addClientImplementationResourceFormAction}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <input type="hidden" name="clientSlug" value={clientSlug} />
          <h2 className="text-sm font-semibold text-slate-900">Add resource</h2>
          <label className="block text-xs font-medium text-slate-600">
            Type
            <select
              name="type"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
              defaultValue="notes"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Title
            <input
              name="title"
              required
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="e.g. Q1 Discovery — workshop board"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            URL (optional)
            <input
              name="url"
              type="url"
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="https://…"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Content / excerpt
            <textarea
              name="content"
              rows={6}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="Paste summary text, bullets, or key constraints."
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Save resource
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Saved ({resources.length})</h2>
          {resources.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No resources for this client yet.</p>
          ) : (
            <ul className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {resources.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-100 bg-white p-3 text-sm shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {r.type}
                      </span>
                      <h3 className="font-medium text-slate-900">{r.title}</h3>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-hub-ink hover:underline break-all"
                        >
                          {r.url}
                        </a>
                      )}
                    </div>
                    <form action={deleteClientImplementationResourceFormAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="clientSlug" value={clientSlug} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                  {r.content ? (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600 line-clamp-5">{r.content}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
