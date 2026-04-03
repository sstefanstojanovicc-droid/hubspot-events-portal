import Link from "next/link";

import { AppTile } from "@/src/components/platform/app-tile";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { clientAppHref } from "@/src/lib/platform/app-links";
import { getInstalledAppsWithOverridesAsync } from "@/src/lib/platform/effective-client";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientAppsPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const installs = await getInstalledAppsWithOverridesAsync(client.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Apps</p>
          <h1 className="text-2xl font-semibold text-hub-bar">Enabled tools</h1>
          <p className="mt-1 text-sm text-slate-600">{client.name}</p>
        </div>
        <Link
          href={`/clients/${client.slug}`}
          className="text-sm font-semibold text-hub-ink hover:underline"
        >
          ← Workspace home
        </Link>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {installs.map((install) => (
          <AppTile
            key={install.app.id}
            app={install.app}
            href={
              install.enabled
                ? clientAppHref(install.app, client.slug)
                : undefined
            }
            badge={
              install.enabled
                ? install.mappingStatus.replaceAll("_", " ")
                : "disabled"
            }
          />
        ))}
      </div>
    </div>
  );
}
