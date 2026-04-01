import { AppTile } from "@/src/components/platform/app-tile";
import {
  appDefinitions,
  getInstallCountByApp,
} from "@/src/lib/platform/mock-data";

export default function AdminAppsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold">Apps</h2>
        <p className="mt-2 text-sm text-slate-600">
          Installed availability is per client. Only Search Board is active in development.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {appDefinitions.map((app) => (
          <AppTile
            key={app.id}
            app={app}
            href={app.status === "ready" ? app.route : undefined}
            badge={`${getInstallCountByApp(app.id)} enabled install(s)`}
          />
        ))}
      </div>
    </div>
  );
}
