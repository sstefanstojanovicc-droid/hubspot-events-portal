import type {
  AppDefinition,
  ClientAppInstall,
  InstalledAppView,
  PlatformUser,
} from "@/src/types/platform-tenant";

export const DEFAULT_DEV_CLIENT_ID = "client-anicca-dev";

export const platformUsers: PlatformUser[] = [
  {
    id: "user-admin-1",
    name: "Platform Admin (dev)",
    email: "admin@platform.local",
    role: "admin",
  },
  {
    id: "user-client-anicca",
    name: "Anicca Dev Test user",
    email: "dev@anicca-test.local",
    role: "client_user",
    clientId: DEFAULT_DEV_CLIENT_ID,
  },
];

export const appDefinitions: AppDefinition[] = [
  {
    id: "app-hubspot-ai",
    key: "hubspot_ai",
    name: "HubSpot AI Implementation",
    description:
      "AI-assisted RevOps planning: project resources (SOW, notes, links), mock chat, and reviewable write plans before HubSpot changes.",
    status: "ready",
    route: "/portal",
    clientWorkspacePath: "hubspot-ai",
    audience: "both",
  },
  {
    id: "app-search-board",
    key: "search_board",
    name: "Search Board",
    description:
      "Executive search workspace: candidates, shortlists, and client-facing boards backed by HubSpot.",
    status: "ready",
    route: "/apps/search-board",
    audience: "both",
  },
  {
    id: "app-events",
    key: "events",
    name: "Events",
    description: "Event programmes and registrations (placeholder).",
    status: "planned",
    route: "/portal",
    audience: "both",
  },
  {
    id: "app-calendar",
    key: "calendar",
    name: "Calendar",
    description: "Calendar and timeline views (placeholder).",
    status: "planned",
    route: "/portal",
    audience: "both",
  },
  {
    id: "app-supered",
    key: "supered_replacement",
    name: "Action Plans",
    description:
      "Implementation and onboarding plans: templates, tasks, and handover (coming soon).",
    status: "planned",
    route: "/portal",
    clientWorkspacePath: "action-plans",
    audience: "both",
  },
  {
    id: "app-cpq",
    key: "cpq",
    name: "CPQ",
    description: "Configure, price, quote flows (placeholder).",
    status: "planned",
    route: "/portal",
    audience: "both",
  },
];

function buildDefaultInstallsForClient(clientId: string): ClientAppInstall[] {
  return appDefinitions.map((app) => ({
    id: `install-${clientId}-${app.id}`,
    clientId,
    appId: app.id,
    enabled: app.key === "search_board" || app.key === "hubspot_ai",
    mappingStatus: "not_started" as const,
  }));
}

let clientAppInstallStore: ClientAppInstall[] =
  buildDefaultInstallsForClient(DEFAULT_DEV_CLIENT_ID);

/** Idempotent: adds default app install rows for a new tenant (Search Board on, others off). */
export function registerNewClientAppInstalls(clientId: string): void {
  if (clientAppInstallStore.some((i) => i.clientId === clientId)) return;
  clientAppInstallStore = [
    ...clientAppInstallStore,
    ...buildDefaultInstallsForClient(clientId),
  ];
}

export function getMockCurrentPlatformAdmin() {
  return platformUsers.find((user) => user.role === "admin") ?? null;
}

export function getMockCurrentClientUser() {
  return platformUsers.find((user) => user.role === "client_user") ?? null;
}

export function getInstalledAppsForClient(clientId: string): InstalledAppView[] {
  const installs = clientAppInstallStore.filter(
    (install) => install.clientId === clientId,
  );

  return installs
    .map((install) => {
      const app = appDefinitions.find((definition) => definition.id === install.appId);
      if (!app) {
        return null;
      }

      return {
        app,
        enabled: install.enabled,
        mappingStatus: install.mappingStatus,
      };
    })
    .filter((item): item is InstalledAppView => item !== null);
}

export function getEnabledAppsForClient(clientId: string): InstalledAppView[] {
  return getInstalledAppsForClient(clientId).filter((install) => install.enabled);
}

export function getInstallCountByApp(appId: string): number {
  return clientAppInstallStore.filter(
    (install) => install.appId === appId && install.enabled,
  ).length;
}
