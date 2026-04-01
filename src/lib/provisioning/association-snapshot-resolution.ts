import "server-only";

import type { AppInstallBlueprint } from "@/src/types/app-install-blueprint";
import { getStandardObjectTypeId } from "@/src/lib/hubspot/standard-object-type-ids";
import {
  resolveCustomObjectInSnapshot,
  type HubSpotCustomSchemaSnapshot,
} from "@/src/lib/provisioning/hubspot-custom-schema-snapshot";

/** Finds HubSpot association type id from schema snapshot for a blueprint association. */
export function resolveAssociationTypeIdFromSnapshot(
  blueprint: AppInstallBlueprint,
  associationId: string,
  snapshot: HubSpotCustomSchemaSnapshot,
  objectTypeIdByBlueprintKey: Record<string, string>,
): string | undefined {
  const def = blueprint.associations.find((a) => a.id === associationId);
  if (!def) return undefined;

  const fromId =
    def.from.kind === "hubspot_standard"
      ? getStandardObjectTypeId(def.from.objectType)
      : objectTypeIdByBlueprintKey[def.from.objectKey];
  const toId =
    def.to.kind === "hubspot_standard"
      ? getStandardObjectTypeId(def.to.objectType)
      : objectTypeIdByBlueprintKey[def.to.objectKey];
  if (!fromId || !toId) return undefined;

  const fromRef = def.from;
  const toRef = def.to;
  const fromObjDef =
    fromRef.kind === "blueprint_custom"
      ? blueprint.customObjects.find((o) => o.objectKey === fromRef.objectKey)
      : undefined;
  const toObjDef =
    toRef.kind === "blueprint_custom"
      ? blueprint.customObjects.find((o) => o.objectKey === toRef.objectKey)
      : undefined;
  const fromSchemaSnap =
    fromObjDef != null
      ? resolveCustomObjectInSnapshot(snapshot, { schemaName: fromObjDef.schemaName })
      : undefined;
  const toSchemaSnap =
    toObjDef != null
      ? resolveCustomObjectInSnapshot(snapshot, { schemaName: toObjDef.schemaName })
      : undefined;

  const schemaSnaps = [fromSchemaSnap, toSchemaSnap];

  for (const sn of schemaSnaps) {
    if (!sn) continue;
    for (const edge of sn.associations) {
      const f = edge.fromObjectTypeId;
      const t = edge.toObjectTypeId;
      if (!f || !t) continue;
      const typesMatch = (f === fromId && t === toId) || (f === toId && t === fromId);
      if (!typesMatch) continue;
      if (edge.associationTypeId) {
        return edge.associationTypeId;
      }
    }
  }

  return undefined;
}
