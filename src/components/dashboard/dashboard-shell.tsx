import { auth } from "@/auth";
import { SignOutButton } from "@/src/components/auth/sign-out-button";
import { AdminPlatformSidebar } from "@/src/components/dashboard/admin-platform-sidebar";
import { CollapsibleWorkspaceShell } from "@/src/components/dashboard/collapsible-workspace-shell";
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
import { getClientAccountById } from "@/src/lib/platform/client-accounts-repo";
import { clientAppHref } from "@/src/lib/platform/app-links";

interface DashboardShellProps {
  children: React.ReactNode;
}

export async function DashboardShell({ children }: DashboardShellProps) {
  const session = (await auth())!;
  const workspaceClientId = await getWorkspaceClientId();
  const workspaceClient = await getClientAccountById(workspaceClientId);
  const logoSrc = await getSidebarLogoSrc();

  let mode: DevPlatformView;
  if (isAdminRole(session.user.role)) {
    mode = await getDevPlatformView();
  } else {
    mode = "client";
  }

  const enabledForNav =
    mode === "client" ? await getEnabledAppsWithOverridesAsync(workspaceClientId) : [];
  const showDevSwitcher = session.user.role === "admin";
  const clientSlug = workspaceClient?.slug;

  const logoEl = logoSrc ? (
    <img
      src={logoSrc}
      alt=""
      className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-0.5 shadow-sm"
    />
  ) : (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
      style={{ background: "linear-gradient(135deg, #ff7a59 0%, #f2553d 100%)" }}
      aria-hidden
    >
      H
    </div>
  );

  const topBar = (
    <div className="border-b-2 border-hub bg-hub-bar px-4 py-2.5 shadow-sm sm:px-5">
      <div className="mx-auto flex max-w-[min(100%,90rem)] flex-wrap items-center justify-between gap-3">
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
  );

  const clientNavItems =
    clientSlug != null
      ? [
          { href: `/clients/${clientSlug}`, label: "Dashboard" },
          { href: `/clients/${clientSlug}/hubspot`, label: "HubSpot" },
          { href: `/clients/${clientSlug}/apps`, label: "Apps" },
          { href: `/clients/${clientSlug}/action-plans`, label: "Action Plans" },
          { href: `/clients/${clientSlug}/packages`, label: "Packages" },
          { href: `/clients/${clientSlug}/fathom-calls`, label: "Fathom Calls" },
          { href: `/clients/${clientSlug}/training`, label: "Training" },
          { href: `/clients/${clientSlug}/users`, label: "Users" },
          { href: `/clients/${clientSlug}/logs`, label: "Logs" },
          { href: `/clients/${clientSlug}/settings`, label: "Settings" },
        ]
      : [{ href: "/portal", label: "Home" }];

  const clientAppShortcuts = enabledForNav.map(({ app }) => ({
    href: clientSlug ? clientAppHref(app, clientSlug) : app.route,
    label: app.name,
  }));

  return (
    <CollapsibleWorkspaceShell
      brandTitle={BRANDING_APP_NAME}
      logoEl={logoEl}
      topBar={topBar}
      navContent={mode === "client" ? undefined : <AdminPlatformSidebar />}
      navItems={mode === "client" ? clientNavItems : []}
      appShortcutLabel={mode === "client" ? "App shortcuts" : undefined}
      appShortcutItems={mode === "client" ? clientAppShortcuts : undefined}
    >
      {children}
    </CollapsibleWorkspaceShell>
  );
}
