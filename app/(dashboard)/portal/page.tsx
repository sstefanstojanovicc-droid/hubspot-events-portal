import { AppTile } from "@/src/components/platform/app-tile";
import {
  getDevImpersonateClientId,
  getDevPlatformView,
} from "@/src/lib/platform/dev-view-cookies";
import { getEnabledAppsWithOverrides } from "@/src/lib/platform/effective-client";
import { getClientById } from "@/src/lib/platform/mock-data";

export default async function ClientPortalPage() {
  const mode = await getDevPlatformView();
  const clientId = await getDevImpersonateClientId();
  const client = getClientById(clientId);

  if (!client) {
    return (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Client home</h2>
        <p className="text-sm text-slate-600">Unknown dev client id.</p>
      </div>
    );
  }

  const enabledApps = getEnabledAppsWithOverrides(client.id);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Apps</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enabled products for this tenant. Switch to Admin in the header to manage HubSpot and
          provisioning.
        </p>
        {mode === "client" ? (
          <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
            Viewing as client: <span className="font-semibold">{client.name}</span>
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Admin preview of client apps — use <strong>Client</strong> in the header for the same UI
            without admin routes.
          </p>
        )}
      </header>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Enabled apps
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
