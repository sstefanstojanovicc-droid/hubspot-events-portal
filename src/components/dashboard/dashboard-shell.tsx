import Link from "next/link";

import { DevViewSwitcher } from "@/src/components/dashboard/dev-view-switcher";
import {
  getDevImpersonateClientId,
  getDevPlatformView,
} from "@/src/lib/platform/dev-view-cookies";
import { getEnabledAppsWithOverrides } from "@/src/lib/platform/effective-client";
import { getClientById } from "@/src/lib/platform/mock-data";

interface DashboardShellProps {
  children: React.ReactNode;
}

const navLinkClass =
  "block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100";

const navDisabledClass =
  "block cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium text-slate-400";

export async function DashboardShell({ children }: DashboardShellProps) {
  const mode = await getDevPlatformView();
  const impersonateClientId = await getDevImpersonateClientId();
  const impersonateClient = getClientById(impersonateClientId);
  const enabledForNav =
    mode === "client" ? getEnabledAppsWithOverrides(impersonateClientId) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white">
            {mode === "client" ? (
              <>
                Viewing as client:{" "}
                <span className="font-semibold">
                  {impersonateClient?.name ?? impersonateClientId}
                </span>
              </>
            ) : (
              <span className="text-slate-200">Dev view: Admin (full platform)</span>
            )}
          </p>
          <DevViewSwitcher mode={mode} clientLabel={impersonateClient?.name} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <aside className="w-72 shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold">HubSpot Platform</h1>
          <p className="mt-1 text-sm text-slate-600">
            Admin client setups, app catalogue, and Search Board.
          </p>

          {mode === "client" ? (
            <nav className="mt-6 flex flex-col gap-1">
              <Link href="/portal" className={navLinkClass}>
                Home
              </Link>
              {enabledForNav.map(({ app }) => (
                <Link key={app.id} href={app.route} className={navLinkClass}>
                  {app.name}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="mt-6 flex flex-col gap-1">
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <Link href="/admin/clients" className={navLinkClass}>
                Client accounts
              </Link>
              <Link href="/admin/apps" className={navLinkClass}>
                Apps
              </Link>

              <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Products
              </p>
              <Link href="/apps/search-board" className={navLinkClass}>
                Search Board
              </Link>
              <span className={navDisabledClass} title="Coming soon">
                Events
              </span>
              <span className={navDisabledClass} title="Coming soon">
                Calendar
              </span>
              <span className={navDisabledClass} title="Coming soon">
                Supered Replacement
              </span>
              <span className={navDisabledClass} title="Coming soon">
                CPQ
              </span>
            </nav>
          )}
        </aside>
        <main className="min-h-[80vh] flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
