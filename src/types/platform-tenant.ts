export type PlatformRole = "admin" | "client_admin" | "client_user";
export type ClientConnectionStatus =
  | "connected"
  | "ready_to_connect"
  | "attention_needed"
  | "not_connected";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  clientId?: string;
}

export interface ClientAccount {
  id: string;
  name: string;
  slug: string;
  hubspotPortalId: string;
  websiteUrl: string;
  primaryContactsJson: string;
  connectionStatus: ClientConnectionStatus;
  createdAt: Date;
  lastHubspotSyncAt: Date | null;
}

export interface AppDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  status: "ready" | "planned";
  route: string;
  /** When set, client sidebar links to `/clients/[slug]/…` instead of `route`. */
  clientWorkspacePath?: string;
  audience: "client" | "admin" | "both";
}

export interface ClientAppInstall {
  id: string;
  clientId: string;
  appId: string;
  enabled: boolean;
  mappingStatus: "not_started" | "in_progress" | "configured" | "install_failed";
}

export interface InstalledAppView {
  app: AppDefinition;
  enabled: boolean;
  mappingStatus: ClientAppInstall["mappingStatus"];
}
