import Link from "next/link";

import { BrandingLogoForm } from "@/src/components/admin/branding-logo-form";
import { getSidebarLogoSrc } from "@/src/lib/platform/branding";

export default async function AdminSettingsBrandingPage() {
  const logoSrc = await getSidebarLogoSrc();

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-xs text-slate-500">
          <Link href="/admin/settings" className="text-hub-ink hover:underline">
            Settings
          </Link>
          <span className="text-slate-400"> · </span>
          Branding
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-hub-bar">Branding</h2>
        <p className="mt-1 text-sm text-slate-600">
          Logo and visual identity for the workspace sidebar.
        </p>
      </header>

      <section className="max-w-xl rounded-xl border border-slate-200 bg-gradient-to-br from-white to-hub-muted/40 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-hub-bar">Sidebar logo</h3>
        <p className="mt-2 text-sm text-slate-600">
          PNG, JPG, WebP, GIF, or SVG — stored on the server.
        </p>
        <div className="mt-5">
          <BrandingLogoForm initialSrc={logoSrc} />
        </div>
      </section>
    </div>
  );
}
