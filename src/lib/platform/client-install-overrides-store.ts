import "server-only";

import type { ClientAppInstall } from "@/src/types/platform-tenant";

type PartialOverride = Partial<Pick<ClientAppInstall, "enabled" | "mappingStatus">>;

const memory = new Map<string, PartialOverride>();

function key(clientId: string, appId: string) {
  return `${clientId}::${appId}`;
}

export function getClientAppInstallOverrides(
  clientId: string,
  appId: string,
): PartialOverride | undefined {
  return memory.get(key(clientId, appId));
}

export function setClientAppInstallOverride(
  clientId: string,
  appId: string,
  patch: PartialOverride,
): void {
  const k = key(clientId, appId);
  const prev = memory.get(k) ?? {};
  memory.set(k, { ...prev, ...patch });
}
