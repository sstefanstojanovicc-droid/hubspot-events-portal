import { candidatePortalConfig } from "@/src/config/portals/candidate";
import type { PortalConfig } from "@/src/types/platform";

export const portalRegistry: PortalConfig[] = [candidatePortalConfig];

export function getPortalConfig(portalId: string): PortalConfig | undefined {
  return portalRegistry.find((portal) => portal.id === portalId);
}

export function getObjectModule(objectType: string) {
  for (const portal of portalRegistry) {
    const objectModule = portal.modules.find((item) => item.objectType === objectType);
    if (objectModule) {
      return { portal, module: objectModule };
    }
  }

  return undefined;
}
