import Link from "next/link";
import { notFound } from "next/navigation";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { prisma } from "@/src/lib/prisma";

type PageProps = { params: Promise<{ slug: string; packageId: string }> };

export default async function ClientPackageDefinitionViewPage({ params }: PageProps) {
  const { slug, packageId } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const def = await prisma.packageDefinition.findFirst({
    where: { id: packageId },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });

  if (!def) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link
          href={`/clients/${client.slug}/packages`}
          className="font-medium text-hub-ink hover:underline"
        >
          ← Installed packages
        </Link>
      </nav>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Package</p>
        <h1 className="text-2xl font-semibold text-hub-bar">{def.name}</h1>
        <p className="mt-2 text-sm text-slate-600">{def.description || "No description."}</p>
      </header>
      <section>
        <h2 className="text-sm font-semibold text-slate-800">Versions</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {def.versions.map((v) => (
            <li key={v.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="font-mono font-medium">{v.versionLabel}</span>
              {v.notes ? <p className="text-slate-600">{v.notes}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
