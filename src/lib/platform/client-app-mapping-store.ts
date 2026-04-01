import "server-only";

import type { AppInstallBlueprint } from "@/src/types/app-install-blueprint";
import type { SearchBoardInstallReport } from "@/src/types/search-board-install-report";

/**
 * Platform-side provisioning result per client + app.
 * Replace this module with a database repository without changing callers.
 */

export interface ClientAppProvisioningMapping {
  clientId: string;
  appKey: string;
  blueprintId: string;
  blueprintVersion: string;
  updatedAt: string;
  /** Resolved HubSpot identifiers after a successful install (future). */
  hubspot: {
    objects: Record<
      string,
      {
        schemaName: string;
        objectTypeId: string;
      }
    >;
    /** objectKey -> propertyName -> hubspot internal name (usually same). */
    properties: Record<string, Record<string, string>>;
    associationTypeIds: Record<string, string>;
  };
  /** Raw mapping key store aligned with blueprint.mappingKeys. */
  mappingKeyValues: Record<string, string>;
  /** Last Search Board live install outcome (success or partial failure). */
  lastInstallReport?: SearchBoardInstallReport;
}

const memoryStore = new Map<string, ClientAppProvisioningMapping>();

function storeKey(clientId: string, appKey: string) {
  return `${clientId}::${appKey}`;
}

export function getClientAppMapping(
  clientId: string,
  appKey: string,
): ClientAppProvisioningMapping | undefined {
  return memoryStore.get(storeKey(clientId, appKey));
}

/**
 * Persists mapping (mock memory). Future: upsert row in DB.
 */
export function saveClientAppProvisioningMapping(
  record: ClientAppProvisioningMapping,
): void {
  memoryStore.set(storeKey(record.clientId, record.appKey), record);
}

/** Preview layer for install UI — merges stored mapping keys if present. */
export function getStoredClientAppMappingPreview(
  clientId: string,
  appKey: string,
): Record<string, string> | null {
  const row = getClientAppMapping(clientId, appKey);
  if (!row) return null;
  return { ...row.mappingKeyValues };
}

/** Builds a mapping record template from a blueprint after a future successful install. */
export function createMappingTemplateFromBlueprint(
  blueprint: AppInstallBlueprint,
): Pick<
  ClientAppProvisioningMapping,
  "blueprintId" | "blueprintVersion" | "hubspot" | "mappingKeyValues"
> {
  const objects: ClientAppProvisioningMapping["hubspot"]["objects"] = {};
  for (const o of blueprint.customObjects) {
    objects[o.objectKey] = {
      schemaName: o.schemaName,
      objectTypeId: "",
    };
  }

  const properties: ClientAppProvisioningMapping["hubspot"]["properties"] = {};
  for (const o of blueprint.customObjects) {
    properties[o.objectKey] = {};
    for (const p of o.requiredProperties) {
      properties[o.objectKey][p.name] = p.name;
    }
  }

  return {
    blueprintId: blueprint.id,
    blueprintVersion: blueprint.version,
    hubspot: {
      objects,
      properties,
      associationTypeIds: {},
    },
    mappingKeyValues: {},
  };
}
