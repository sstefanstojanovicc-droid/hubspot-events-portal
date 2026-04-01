import { auth } from "@/auth";
import { AppTile } from "@/src/components/platform/app-tile";
import { isAdminRole } from "@/src/lib/auth/guards";
import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import { getDevPlatformView } from "@/src/lib/platform/dev-view-cookies";
import { getEnabledAppsWithOverridesAsync } from "@/src/lib/platform/effective-client";
import { getClientById } from "@/src/lib/platform/mock-data";

export default async function ClientPortalPage() {
  const session = (await auth())!;
  const mode =
    isAdminRole(session.user.role) ? await getDevPlatformView() : ("client" as const);
  const clientId = await getWorkspaceClientId();
  const client = getClientById(clientId);

  if (!client) {
    return (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Client home</h2>
        <p className="text-sm text-slate-600">Unknown dev client id.</p>
      </div>
    );
  }

  const enabledApps = await getEnabledAppsWithOverridesAsync(client.id);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-hub-bar">Apps</h2>
        {mode === "client" ? (
          <p className="mt-1 text-sm text-slate-600">{client.name}</p>
        ) : null}
      </header>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Available
        </h3>
        {enabledApps.length === 0 ? (
          <p className="text-sm text-slate-600">No apps are enabled for this account yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {enabledApps.map((install) => (
              <AppTile
                key={install.app.id}
                app={install.app}
                href={install.app.route}
                badge={`status: ${install.mappingStatus.replaceAll("_", " ")}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
