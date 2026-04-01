import type {
  AppDefinition,
  ClientAccount,
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
    role: "platform_admin",
  },
  {
    id: "user-client-anicca",
    name: "Anicca Dev Test user",
    email: "dev@anicca-test.local",
    role: "client_user",
    clientId: DEFAULT_DEV_CLIENT_ID,
  },
];

/** Single real dev tenant — replace with DB-backed rows later. */
export const clientAccounts: ClientAccount[] = [
  {
    id: DEFAULT_DEV_CLIENT_ID,
    name: "Anicca Dev Test Account",
    slug: "anicca-dev-test",
    hubspotPortalId: "46168086",
    connectionStatus: "ready_to_connect",
  },
];

export const appDefinitions: AppDefinition[] = [
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
    name: "Supered Replacement",
    description: "Training / enablement surface (placeholder).",
    status: "planned",
    route: "/portal",
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

export const clientAppInstalls: ClientAppInstall[] = [
  {
    id: "install-anicca-search-board",
    clientId: DEFAULT_DEV_CLIENT_ID,
    appId: "app-search-board",
    enabled: true,
    mappingStatus: "not_started",
  },
  {
    id: "install-anicca-events",
    clientId: DEFAULT_DEV_CLIENT_ID,
    appId: "app-events",
    enabled: false,
    mappingStatus: "not_started",
  },
  {
    id: "install-anicca-calendar",
    clientId: DEFAULT_DEV_CLIENT_ID,
    appId: "app-calendar",
    enabled: false,
    mappingStatus: "not_started",
  },
  {
    id: "install-anicca-supered",
    clientId: DEFAULT_DEV_CLIENT_ID,
    appId: "app-supered",
    enabled: false,
    mappingStatus: "not_started",
  },
  {
    id: "install-anicca-cpq",
    clientId: DEFAULT_DEV_CLIENT_ID,
    appId: "app-cpq",
    enabled: false,
    mappingStatus: "not_started",
  },
];

export function getMockCurrentPlatformAdmin() {
  return platformUsers.find((user) => user.role === "platform_admin") ?? null;
}

export function getMockCurrentClientUser() {
  return platformUsers.find((user) => user.role === "client_user") ?? null;
}

export function getClientById(id: string) {
  return clientAccounts.find((client) => client.id === id);
}

export function getInstalledAppsForClient(clientId: string): InstalledAppView[] {
  const installs = clientAppInstalls.filter((install) => install.clientId === clientId);

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
  return clientAppInstalls.filter(
    (install) => install.appId === appId && install.enabled,
  ).length;
}
