import Link from "next/link";

import { auth } from "@/auth";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientSettingsBrandingPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const session = await auth();
  const isPlatformAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs text-slate-500">
          <Link href={`/clients/${client.slug}/settings`} className="text-hub-ink hover:underline">
            Settings
          </Link>
          <span className="text-slate-400"> · </span>
          Branding
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-hub-bar">Branding</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sidebar logo and workspace chrome are managed at the platform level so every client sees a
          consistent partner experience.
        </p>
      </header>

      {isPlatformAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700">
            Upload or replace the sidebar logo in platform settings.
          </p>
          <Link
            href="/admin/settings/branding"
            className="mt-4 inline-flex rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hub-hover"
          >
            Open platform branding
          </Link>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Branding is managed by your platform administrator. Contact them if the logo or app
          name needs to change.
        </p>
      )}

      <Link
        href={`/clients/${client.slug}/settings`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        ← All settings
      </Link>
    </div>
  );
}
