import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { listTrainingModulesForClient } from "@/src/lib/workspace/training-repo";

type PageProps = { params: Promise<{ slug: string }> };

export default async function TrainingPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const modules = await listTrainingModulesForClient(client.id);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Training</p>
        <h1 className="text-2xl font-semibold text-hub-bar">Modules</h1>
        <p className="mt-1 text-sm text-slate-600">
          Guides and handover content for {client.name}. Global templates appear for every workspace.
        </p>
      </header>

      {modules.length === 0 ? (
        <p className="text-sm text-slate-600">No training modules yet. Run seed or add content in admin.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {modules.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {m.contentType.replaceAll("_", " ")}
                {!m.clientAccountId ? " · Global" : ""}
              </p>
              <h2 className="mt-1 font-semibold text-slate-900">{m.title}</h2>
              {m.body ? (
                <p className="mt-2 line-clamp-4 text-sm text-slate-600 whitespace-pre-wrap">
                  {m.body}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/clients/${client.slug}`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← Workspace
      </Link>
    </div>
  );
}
