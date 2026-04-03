import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { updateClientWorkspaceProfileFormAction } from "@/src/lib/workspace/actions/workspace-actions";

type PageProps = { params: Promise<{ slug: string }> };

function formatContactsJson(raw: string): string {
  const s = raw?.trim() || "[]";
  try {
    const v = JSON.parse(s) as unknown;
    if (Array.isArray(v)) {
      return JSON.stringify(v, null, 2);
    }
  } catch {
    /* keep as-is */
  }
  return s;
}

export default async function ClientSettingsGeneralPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const contactsPretty = formatContactsJson(client.primaryContactsJson);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs text-slate-500">
          <Link href={`/clients/${client.slug}/settings`} className="text-hub-ink hover:underline">
            Settings
          </Link>
          <span className="text-slate-400"> · </span>
          General
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-hub-bar">Workspace profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Basic fields shown on the client dashboard. HubSpot CRM data still lives in HubSpot;
          this layer stores workspace-specific context.
        </p>
      </header>

      <form
        action={updateClientWorkspaceProfileFormAction}
        className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-slate-50/50 p-6"
      >
        <input type="hidden" name="clientAccountId" value={client.id} />
        <input type="hidden" name="clientSlug" value={client.slug} />
        <label className="block text-sm font-medium text-slate-700">
          Website URL
          <input
            name="websiteUrl"
            type="url"
            defaultValue={client.websiteUrl || ""}
            placeholder="https://example.com"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Primary contacts (JSON array)
          <textarea
            name="primaryContactsJson"
            rows={10}
            defaultValue={contactsPretty}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            placeholder='[{"name":"Jane Doe","email":"jane@company.com","role":"VP"}]'
          />
          <span className="mt-1 block text-xs text-slate-500">
            Use a JSON array of objects with optional <code className="text-[11px]">name</code>,{" "}
            <code className="text-[11px]">email</code>, <code className="text-[11px]">role</code>.
          </span>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
        >
          Save profile
        </button>
      </form>

      <Link
        href={`/clients/${client.slug}/settings`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← All settings
      </Link>
    </div>
  );
}
