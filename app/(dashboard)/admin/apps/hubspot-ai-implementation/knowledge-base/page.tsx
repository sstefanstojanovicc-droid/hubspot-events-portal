import {
  addKnowledgeBaseEntryFormAction,
  deleteKnowledgeBaseEntryFormAction,
  listKnowledgeBaseEntriesAction,
} from "@/src/lib/platform/actions/knowledge-base";

export default async function HubspotAiKnowledgeBasePage() {
  const entries = await listKnowledgeBaseEntriesAction();

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600 max-w-3xl">
        Global reference only — not tied to a client. Store HubSpot documentation links, pasted articles, and
        operator rules so every implementation run (per client) is grounded in how HubSpot works. Choose a client
        from the dropdown above to upload client-specific SOWs and notes under <strong>Resources</strong> and use
        the <strong>Builder</strong> for that account.
      </p>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          action={addKnowledgeBaseEntryFormAction}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">Add entry</h2>
          <label className="block text-xs font-medium text-slate-600">
            Kind
            <select
              name="kind"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
              defaultValue="rule"
            >
              <option value="hubspot_article">HubSpot article / doc</option>
              <option value="rule">Operator rule</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Title
            <input
              name="title"
              required
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="e.g. Create custom deal properties"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Source URL (optional)
            <input
              name="sourceUrl"
              type="url"
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="https://knowledge.hubspot.com/..."
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Body / excerpt
            <textarea
              name="body"
              rows={6}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              placeholder="Paste key paragraphs or write concise rules for the assistant."
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Save entry
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Entries ({entries.length})</h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No Knowledge Base rows yet.</p>
          ) : (
            <ul className="mt-3 max-h-[480px] space-y-3 overflow-y-auto pr-1">
              {entries.map((e) => (
                <li key={e.id} className="rounded-lg border border-slate-100 bg-white p-3 text-sm shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {e.kind.replace("_", " ")}
                      </span>
                      <h3 className="font-medium text-slate-900">{e.title}</h3>
                      {e.sourceUrl && (
                        <a
                          href={e.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-hub-ink hover:underline break-all"
                        >
                          {e.sourceUrl}
                        </a>
                      )}
                    </div>
                    <form action={deleteKnowledgeBaseEntryFormAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                  {e.body ? (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600 line-clamp-6">{e.body}</p>
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
