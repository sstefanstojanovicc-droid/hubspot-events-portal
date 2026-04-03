import Link from "next/link";

import { prisma } from "@/src/lib/prisma";

export default async function AdminTemplatesPage() {
  const templates = await prisma.actionPlanTemplate.findMany({
    orderBy: { name: "asc" },
    include: { tasks: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-hub-bar">Templates</h2>
        <p className="mt-1 text-sm text-slate-600">
          Action plan templates (global when no client is set). Managed via seed or future builder.
        </p>
      </header>

      {templates.length === 0 ? (
        <p className="text-sm text-slate-600">No templates. Run seed.</p>
      ) : (
        <ul className="space-y-4">
          {templates.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{t.name}</h3>
              <p className="text-sm text-slate-600">{t.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {t.clientAccountId ? `Tenant-specific · ${t.clientAccountId}` : "Global"}
              </p>
              <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
                {t.tasks.map((task) => (
                  <li key={task.id}>
                    {task.sectionTitle ? `[${task.sectionTitle}] ` : ""}
                    {task.title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin/clients" className="text-sm font-semibold text-hub-ink hover:underline">
        ← Clients
      </Link>
    </div>
  );
}
