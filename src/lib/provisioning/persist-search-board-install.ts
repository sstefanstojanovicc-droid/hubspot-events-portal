import "server-only";

import { getBlueprintById } from "@/src/config/blueprints/registry";
import { setClientAppInstallOverride } from "@/src/lib/platform/client-install-overrides-store";
import {
  createMappingTemplateFromBlueprint,
  getClientAppMapping,
  saveClientAppProvisioningMapping,
} from "@/src/lib/platform/client-app-mapping-store";
import { resolveAssociationTypeIdFromSnapshot } from "@/src/lib/provisioning/association-snapshot-resolution";
import {
  fetchHubSpotCustomSchemaSnapshot,
  resolveCustomObjectInSnapshot,
} from "@/src/lib/provisioning/hubspot-custom-schema-snapshot";
import type { SearchBoardInstallReport } from "@/src/types/search-board-install-report";

const SEARCH_BOARD_APP_ID = "app-search-board";

export type PersistInstallResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type PersistSearchBoardOptions = {
  /** When set, stored on the mapping record and drives install status messaging. */
  installReport?: SearchBoardInstallReport;
};

/**
 * Refetches HubSpot custom schema and saves object / property / association mapping keys.
 * Call after a live install (success or failure) so the platform matches HubSpot.
 */
export async function persistSearchBoardInstallFromSnapshot(
  clientId: string,
  options?: PersistSearchBoardOptions,
): Promise<PersistInstallResult> {
  const blueprint = getBlueprintById("search-board");
  if (!blueprint) {
    return { ok: false, message: "Search Board blueprint not registered." };
  }

  const snapshot = await fetchHubSpotCustomSchemaSnapshot();
  if (snapshot.rawError) {
    return { ok: false, message: `HubSpot snapshot failed: ${snapshot.rawError}` };
  }

  const template = createMappingTemplateFromBlueprint(blueprint);
  const mappingKeyValues: Record<string, string> = {};
  const installReport = options?.installReport;

  for (const obj of blueprint.customObjects) {
    const live = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
    if (live) {
      template.hubspot.objects[obj.objectKey] = {
        schemaName: obj.schemaName,
        objectTypeId: live.objectTypeId,
      };
    }
  }

  for (const obj of blueprint.customObjects) {
    const live = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
    if (!live) continue;
    for (const p of obj.requiredProperties) {
      if (live.properties.has(p.name)) {
        template.hubspot.properties[obj.objectKey][p.name] = p.name;
      }
    }
  }

  const objectTypeIdByBlueprintKey: Record<string, string> = {};
  for (const obj of blueprint.customObjects) {
    const id = template.hubspot.objects[obj.objectKey]?.objectTypeId;
    if (id) {
      objectTypeIdByBlueprintKey[obj.objectKey] = id;
    }
  }

  for (const assoc of blueprint.associations) {
    const tid = resolveAssociationTypeIdFromSnapshot(
      blueprint,
      assoc.id,
      snapshot,
      objectTypeIdByBlueprintKey,
    );
    if (tid) {
      template.hubspot.associationTypeIds[assoc.id] = tid;
    }
  }

  for (const mk of blueprint.mappingKeys) {
    const src = mk.source;
    if (src.type === "blueprint_object") {
      const id = template.hubspot.objects[src.objectKey]?.objectTypeId;
      if (id) mappingKeyValues[mk.key] = id;
    } else if (src.type === "blueprint_property") {
      const map = template.hubspot.properties[src.objectKey];
      if (map?.[src.propertyName]) {
        mappingKeyValues[mk.key] = src.propertyName;
      }
    } else if (src.type === "blueprint_association") {
      const tid = template.hubspot.associationTypeIds[src.associationId];
      if (tid) mappingKeyValues[mk.key] = tid;
    }
  }

  const previous = getClientAppMapping(clientId, blueprint.appKey);

  saveClientAppProvisioningMapping({
    clientId,
    appKey: blueprint.appKey,
    blueprintId: blueprint.id,
    blueprintVersion: blueprint.version,
    updatedAt: new Date().toISOString(),
    hubspot: template.hubspot,
    mappingKeyValues,
    lastInstallReport: installReport ?? previous?.lastInstallReport,
  });

  const mappingStatus =
    installReport == null ? "configured" : installReport.ok ? "configured" : "install_failed";

  setClientAppInstallOverride(clientId, SEARCH_BOARD_APP_ID, {
    mappingStatus,
  });

  const presentObjects = blueprint.customObjects.filter(
    (o) => resolveCustomObjectInSnapshot(snapshot, { schemaName: o.schemaName }) != null,
  ).length;

  if (installReport?.ok) {
    const c = installReport.counts;
    return {
      ok: true,
      message: `Install complete. Saved platform mapping (objects ${presentObjects}/${blueprint.customObjects.length}; created: ${c.schemasCreated} schemas, ${c.propertiesCreated} properties, ${c.groupsCreated} groups, ${c.associationsCreated} associations; skipped: ${c.schemasSkipped}/${c.propertiesSkipped}/${c.associationsSkipped}).`,
    };
  }

  if (installReport && !installReport.ok) {
    return {
      ok: true,
      message: `Install stopped at "${installReport.failedStep ?? "unknown"}": ${installReport.hubspotMessage ?? "HubSpot error"}. HubSpot state was refreshed into the mapping store for a safe retry.`,
    };
  }

  return {
    ok: true,
    message: `Captured schema for ${presentObjects}/${blueprint.customObjects.length} custom objects into platform mapping store.`,
  };
}
