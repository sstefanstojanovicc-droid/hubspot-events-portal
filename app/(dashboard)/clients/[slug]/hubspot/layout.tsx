import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";

const link =
  "block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-hub-muted hover:text-hub-ink";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function HubSpotModuleLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const base = `/clients/${client.slug}/hubspot`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">HubSpot module</p>
        <nav className="flex flex-wrap gap-1">
          <Link href={base} className={link}>
            Overview
          </Link>
          <Link href={`${base}/objects`} className={link}>
            Objects
          </Link>
          <Link href={`${base}/properties`} className={link}>
            Properties
          </Link>
          <Link href={`${base}/pipelines`} className={link}>
            Pipelines
          </Link>
          <Link href={`${base}/sync-logs`} className={link}>
            Sync &amp; logs
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
