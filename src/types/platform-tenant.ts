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
  connectionStatus: ClientConnectionStatus;
}

export interface AppDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  status: "ready" | "planned";
  route: string;
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
