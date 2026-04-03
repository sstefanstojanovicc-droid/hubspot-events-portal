import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientWorkspaceSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settings</p>
        <h1 className="text-2xl font-semibold text-hub-bar">Workspace settings</h1>
        <p className="mt-1 text-sm text-slate-600">{client.name}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">General</h2>
          <p className="mt-1 text-sm text-slate-600">
            Website URL, primary contacts, and fields shown on the dashboard.
          </p>
          <Link
            href={`/clients/${client.slug}/settings/general`}
            className="mt-3 inline-block text-sm font-semibold text-hub-ink hover:underline"
          >
            Edit profile →
          </Link>
        </li>
        <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Branding</h2>
          <p className="mt-1 text-sm text-slate-600">
            Logo and sidebar identity (platform admins manage uploads).
          </p>
          <Link
            href={`/clients/${client.slug}/settings/branding`}
            className="mt-3 inline-block text-sm font-semibold text-hub-ink hover:underline"
          >
            Branding →
          </Link>
        </li>
      </ul>

      <p className="text-sm text-slate-500">
        Account defaults, notifications, and integrations will appear here as the workspace grows.
      </p>

      <Link
        href={`/clients/${client.slug}`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← Workspace
      </Link>
    </div>
  );
}
