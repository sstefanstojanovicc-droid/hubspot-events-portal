import Link from "next/link";

import { getClientAccountBySlug } from "@/src/lib/platform/client-accounts-repo";
import { listRecentAiImplementationVersionsForClient } from "@/src/lib/workspace/packages-repo";

export default async function HubspotAiImplementationVersionsPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const client = await getClientAccountBySlug(clientSlug);
  if (!client) {
    return null;
  }

  const versions = await listRecentAiImplementationVersionsForClient(client.id, 50);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 max-w-3xl">
        Version history for <strong className="font-medium text-slate-800">{client.name}</strong> (notes prefixed with{" "}
        <code className="text-xs">[ai-implementation]</code>
        ).
      </p>

      {versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-sm text-slate-600">
          No tagged versions for this client yet.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
          {versions.map((v) => (
            <li key={v.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-900">{v.package.name}</span>
                <span className="text-xs text-slate-500">{v.createdAt.toLocaleString()}</span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {v.versionLabel}
                {v.package.sourceHubspotPortalId ? ` · portal ${v.package.sourceHubspotPortalId}` : ""}
              </p>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-slate-600">{v.notes}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        <Link href="/admin/package-library" className="font-medium text-hub-ink hover:underline">
          Package library
        </Link>
      </p>
    </div>
  );
}
