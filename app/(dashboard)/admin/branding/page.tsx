import Link from "next/link";

import { BrandingLogoForm } from "@/src/components/admin/branding-logo-form";
import { getSidebarLogoSrc } from "@/src/lib/platform/branding";

export default async function AdminBrandingPage() {
  const logoSrc = await getSidebarLogoSrc();

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-xs text-slate-500">
          <Link href="/dashboard" className="text-hub-ink hover:underline">
            Dashboard
          </Link>
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-hub-bar">Logo</h2>
      </header>

      <section className="max-w-xl rounded-xl border border-slate-200 bg-gradient-to-br from-white to-hub-muted/40 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-hub-bar">Sidebar (top left)</h3>
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
