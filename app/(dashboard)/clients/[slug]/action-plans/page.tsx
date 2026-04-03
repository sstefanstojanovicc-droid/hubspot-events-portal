import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import {
  createManualPlanFormAction,
  createPlanFromTemplateFormAction,
} from "@/src/lib/workspace/actions/workspace-actions";
import {
  listActionPlansForClient,
  listActionPlanTemplatesForClient,
} from "@/src/lib/workspace/action-plans-repo";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ActionPlansListPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const [plans, templates] = await Promise.all([
    listActionPlansForClient(client.id),
    listActionPlanTemplatesForClient(client.id),
  ]);

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Action Plans
            </p>
            <h1 className="text-2xl font-semibold text-hub-bar">Plans</h1>
            <p className="mt-1 text-sm text-slate-600">
              Phased delivery for {client.name} — expand tasks to see cards, links, and checklists.
            </p>
          </div>
          <a
            href="#create-action-plan"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-hub px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
          >
            Create Action Plan
          </a>
        </div>
      </header>

      <section id="create-action-plan" className="grid gap-6 lg:grid-cols-2 scroll-mt-8">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <h2 className="text-sm font-semibold text-slate-900">From template</h2>
          <form action={createPlanFromTemplateFormAction} className="mt-4 space-y-3">
            <input type="hidden" name="clientAccountId" value={client.id} />
            <input type="hidden" name="clientSlug" value={client.slug} />
            <label className="block text-xs font-medium text-slate-600">
              Template
              <select
                name="templateId"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.tasks.length} tasks)
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Plan title (optional)
              <input
                name="title"
                placeholder="Defaults to template name"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
            >
              Create plan
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Blank plan</h2>
          <form action={createManualPlanFormAction} className="mt-4 space-y-3">
            <input type="hidden" name="clientAccountId" value={client.id} />
            <input type="hidden" name="clientSlug" value={client.slug} />
            <label className="block text-xs font-medium text-slate-600">
              Title
              <input
                name="title"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Create
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">All plans</h2>
        {plans.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No plans yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {plans.map((p) => {
              const done = p.tasks.filter((t) => t.done).length;
              const total = p.tasks.length;
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <Link
                      href={`/clients/${client.slug}/action-plans/${p.id}`}
                      className="font-semibold text-hub-ink hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.status} · {p.template?.name ? `from ${p.template.name}` : "manual"} ·{" "}
                      {done}/{total} tasks
                    </p>
                  </div>
                  <span className="text-xs capitalize text-slate-400">{p.status}</span>
                </li>
              );
            })}
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
