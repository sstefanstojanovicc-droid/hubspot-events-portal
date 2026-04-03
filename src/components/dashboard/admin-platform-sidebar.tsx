"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSidebarCollapsed } from "@/src/components/dashboard/sidebar-collapse-context";

const STORAGE_APPS = "hop_admin_nav_apps_open";
const STORAGE_PKGS = "hop_admin_nav_packages_open";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function AdminPlatformSidebar() {
  const pathname = usePathname() ?? "";
  const collapsed = useSidebarCollapsed();

  const [appsOpen, setAppsOpen] = useState(true);
  const [packagesOpen, setPackagesOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const a = localStorage.getItem(STORAGE_APPS);
      const p = localStorage.getItem(STORAGE_PKGS);
      if (a === "0") setAppsOpen(false);
      if (p === "0") setPackagesOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  const appsActive = useMemo(
    () =>
      pathname.startsWith("/apps/search-board") ||
      pathname.startsWith("/admin/apps/hubspot-ai-implementation") ||
      pathname.startsWith("/admin/apps/ai-package-builder"),
    [pathname],
  );

  const packagesActive = useMemo(
    () =>
      pathname.startsWith("/admin/package-library") ||
      pathname.startsWith("/admin/packages/"),
    [pathname],
  );

  useEffect(() => {
    if (!hydrated) return;
    if (appsActive) setAppsOpen(true);
  }, [appsActive, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (packagesActive) setPackagesOpen(true);
  }, [packagesActive, hydrated]);

  const persistApps = useCallback((open: boolean) => {
    setAppsOpen(open);
    try {
      localStorage.setItem(STORAGE_APPS, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const persistPackages = useCallback((open: boolean) => {
    setPackagesOpen(open);
    try {
      localStorage.setItem(STORAGE_PKGS, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const topLink = (
    href: string,
    label: string,
    opts?: { end?: boolean; title?: string },
  ) => {
    const active = opts?.end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return {
      href,
      label,
      active,
      title: opts?.title ?? label,
    };
  };

  const navBtn =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100";
  const navLink = (active: boolean) =>
    cx(
      "block rounded-md px-3 py-2 text-sm font-medium transition",
      active
        ? "border-l-2 border-hub bg-hub-muted/50 pl-[10px] text-hub-bar"
        : "border-l-2 border-transparent pl-[10px] text-slate-700 hover:bg-slate-50 hover:text-hub-ink",
    );
  const childLink = (active: boolean) =>
    cx(
      "block rounded-md py-1.5 pl-8 pr-2 text-sm transition",
      active ? "bg-hub-muted/40 font-semibold text-hub-bar" : "text-slate-600 hover:bg-slate-50 hover:text-hub-ink",
    );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <Link
          href="/dashboard"
          className={navLink(pathname === "/dashboard" || pathname === "/admin")}
          title="Dashboard"
        >
          D
        </Link>
        <Link href="/admin/clients" className={navLink(pathname.startsWith("/admin/clients"))} title="Clients">
          C
        </Link>
        <Link
          href="/apps/search-board"
          className={navLink(pathname.startsWith("/apps/search-board"))}
          title="Search Board"
        >
          S
        </Link>
        <Link
          href="/admin/apps/hubspot-ai-implementation/knowledge-base"
          className={navLink(pathname.startsWith("/admin/apps/hubspot-ai-implementation"))}
          title="HubSpot AI Implementation"
        >
          I
        </Link>
        <Link
          href="/admin/apps/ai-package-builder"
          className={navLink(pathname.startsWith("/admin/apps/ai-package-builder"))}
          title="AI Package Builder"
        >
          B
        </Link>
        <Link
          href="/admin/package-library"
          className={navLink(packagesActive)}
          title="Packages"
        >
          P
        </Link>
        <Link
          href="/admin/integrations"
          className={navLink(pathname.startsWith("/admin/integrations"))}
          title="Integrations"
        >
          N
        </Link>
        <Link href="/admin/settings" className={navLink(pathname.startsWith("/admin/settings"))} title="Settings">
          T
        </Link>
      </div>
    );
  }

  const dash = topLink("/dashboard", "Dashboard", { end: true });
  const clients = topLink("/admin/clients", "Clients");
  const integrations = topLink("/admin/integrations", "Integrations");
  const settings = topLink("/admin/settings", "Settings");

  return (
    <div className="space-y-1">
      <Link href={dash.href} className={navLink(dash.active)} title={dash.title}>
        {dash.label}
      </Link>
      <Link href={clients.href} className={navLink(clients.active)} title={clients.title}>
        {clients.label}
      </Link>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => persistApps(!appsOpen)}
          className={cx(navBtn, appsActive && !appsOpen ? "text-hub-bar" : "")}
          aria-expanded={appsOpen}
        >
          <ChevronIcon open={appsOpen} />
          <span>Apps</span>
        </button>
        {appsOpen ? (
          <div className="mt-0.5 space-y-0.5 border-l border-slate-200 ml-3">
            <Link
              href="/apps/search-board"
              className={childLink(pathname.startsWith("/apps/search-board"))}
            >
              Search Board
            </Link>
            <Link
              href="/admin/apps/hubspot-ai-implementation/knowledge-base"
              className={childLink(pathname.startsWith("/admin/apps/hubspot-ai-implementation"))}
            >
              HubSpot AI Implementation
            </Link>
            <Link
              href="/admin/apps/ai-package-builder"
              className={childLink(pathname.startsWith("/admin/apps/ai-package-builder"))}
            >
              AI Package Builder
            </Link>
          </div>
        ) : null}
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => persistPackages(!packagesOpen)}
          className={cx(navBtn, packagesActive && !packagesOpen ? "text-hub-bar" : "")}
          aria-expanded={packagesOpen}
        >
          <ChevronIcon open={packagesOpen} />
          <span>Packages</span>
        </button>
        {packagesOpen ? (
          <div className="mt-0.5 space-y-0.5 border-l border-slate-200 ml-3">
            <Link
              href="/admin/package-library"
              className={childLink(pathname.startsWith("/admin/package-library"))}
            >
              Package Library
            </Link>
            <Link href="/admin/packages/create" className={childLink(pathname.startsWith("/admin/packages/create"))}>
              Create Package
            </Link>
            <Link
              href="/admin/packages/builder"
              className={childLink(
                pathname.startsWith("/admin/packages/builder") &&
                  !pathname.startsWith("/admin/packages/create"),
              )}
            >
              Package Builder
            </Link>
          </div>
        ) : null}
      </div>

      <Link href={integrations.href} className={navLink(integrations.active)} title={integrations.title}>
        {integrations.label}
      </Link>
      <Link href={settings.href} className={navLink(settings.active)} title={settings.title}>
        {settings.label}
      </Link>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-400"
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {open ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        )}
      </svg>
    </span>
  );
}
