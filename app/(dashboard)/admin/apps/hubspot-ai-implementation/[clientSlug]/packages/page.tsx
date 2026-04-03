import Link from "next/link";

import { getClientAccountBySlug } from "@/src/lib/platform/client-accounts-repo";
import { listPackageDefinitionsWithAiImplementationVersionsForClient } from "@/src/lib/workspace/packages-repo";

const MARKER = "[ai-implementation]";

export default async function HubspotAiImplementationPackagesPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const client = await getClientAccountBySlug(clientSlug);
  if (!client) {
    return null;
  }

  const packages = await listPackageDefinitionsWithAiImplementationVersionsForClient(client.id);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 max-w-3xl">
        Packages created from the Builder for <strong className="font-medium text-slate-800">{client.name}</strong>{" "}
        carry an <code className="text-xs">{MARKER}</code> tag and are linked to this client. They also appear in the
        main library for installation.
      </p>

      {packages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
          <p className="text-sm text-slate-600">No AI implementation packages for this client yet.</p>
          <Link
            href={`/admin/apps/hubspot-ai-implementation/${clientSlug}/builder`}
            className="mt-3 inline-block text-sm font-semibold text-hub-ink hover:underline"
          >
            Open Builder →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {packages.map((pkg) => {
            const v0 = pkg.versions[0];
            return (
              <li key={pkg.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
                  <p className="mt-0.5 text-slate-600 line-clamp-2">{pkg.description}</p>
                  {pkg.sourceHubspotPortalId && (
                    <p className="mt-1 text-xs text-slate-500">Portal: {pkg.sourceHubspotPortalId}</p>
                  )}
                  {v0 && (
                    <p className="mt-1 text-xs text-slate-400">
                      Latest version: {v0.versionLabel} · {v0.createdAt.toLocaleString()}
                    </p>
                  )}
                </div>
                <Link
                  href="/admin/package-library"
                  className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Library
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
