import Link from "next/link";

import { auth } from "@/auth";
import { SignOutButton } from "@/src/components/auth/sign-out-button";
import { isAuthDisabled } from "@/src/lib/auth/auth-disabled";
import { DevViewSwitcher } from "@/src/components/dashboard/dev-view-switcher";
import { isAdminRole } from "@/src/lib/auth/guards";
import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import {
  BRANDING_APP_NAME,
  getSidebarLogoSrc,
} from "@/src/lib/platform/branding";
import {
  getDevPlatformView,
  type DevPlatformView,
} from "@/src/lib/platform/dev-view-cookies";
import { getEnabledAppsWithOverridesAsync } from "@/src/lib/platform/effective-client";
import { getClientById } from "@/src/lib/platform/mock-data";

interface DashboardShellProps {
  children: React.ReactNode;
}

const navLinkClass =
  "block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-hub-muted hover:text-hub-ink";

export async function DashboardShell({ children }: DashboardShellProps) {
  const session = (await auth())!;
  const workspaceClientId = await getWorkspaceClientId();
  const workspaceClient = getClientById(workspaceClientId);
  const logoSrc = await getSidebarLogoSrc();

  let mode: DevPlatformView;
  if (isAdminRole(session.user.role)) {
    mode = await getDevPlatformView();
  } else {
    mode = "client";
  }

  const enabledForNav =
    mode === "client" ? await getEnabledAppsWithOverridesAsync(workspaceClientId) : [];
  const showDevSwitcher = isAdminRole(session.user.role);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <div className="border-b-2 border-hub bg-hub-bar px-6 py-2.5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white">
            {mode === "client" ? (
              <>
                {showDevSwitcher ? "As client · " : ""}
                <span className="font-semibold">
                  {workspaceClient?.name ?? workspaceClientId}
                </span>
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  {session.user.name ?? session.user.email}
                </span>
              </>
            ) : (
              <span className="text-slate-100">
                {session.user.name ?? session.user.email}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {showDevSwitcher ? (
              <DevViewSwitcher mode={mode} clientLabel={workspaceClient?.name} />
            ) : null}
            {!isAuthDisabled() ? <SignOutButton /> : null}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <aside className="w-72 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md ring-1 ring-black/[0.04]">
          <div className="border-b border-slate-100 bg-gradient-to-b from-white to-hub-muted/30 px-4 py-4">
            <div className="flex items-start gap-3">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1 shadow-sm"
                />
              ) : (
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #ff7a59 0%, #f2553d 100%)" }}
                  aria-hidden
                >
                  H
                </div>
              )}
              <div className="min-w-0 pt-0.5">
                <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-hub-bar">
                  {BRANDING_APP_NAME}
                </h1>
              </div>
            </div>
          </div>

          <nav className="p-3">
            {mode === "client" ? (
              <div className="flex flex-col gap-0.5">
                <Link href="/portal" className={navLinkClass}>
                  Home
                </Link>
                {enabledForNav.map(({ app }) => (
                  <Link key={app.id} href={app.route} className={navLinkClass}>
                    {app.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <Link href="/dashboard" className={navLinkClass}>
                  Dashboard
                </Link>
                <Link href="/admin/clients" className={navLinkClass}>
                  Clients
                </Link>
                <Link href="/admin/apps" className={navLinkClass}>
                  Apps
                </Link>
                <Link href="/admin/branding" className={navLinkClass}>
                  Logo
                </Link>
                <Link href="/admin/diagnostics" className={navLinkClass}>
                  Status
                </Link>
                <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Tools
                </p>
                <Link href="/apps/search-board" className={navLinkClass}>
                  Search Board
                </Link>
              </div>
            )}
          </nav>
        </aside>
        <main className="min-h-[80vh] flex-1 rounded-xl border border-slate-200/80 bg-white p-6 shadow-md ring-1 ring-black/[0.04]">
          {children}
        </main>
      </div>
    </div>
  );
}
