import "server-only";

import { getBlueprintById } from "@/src/config/blueprints/registry";
import type {
  AppInstallBlueprint,
  BlueprintAssociationDefinition,
  BlueprintObjectRef,
} from "@/src/types/app-install-blueprint";
import type {
  ProvisioningInstallPlan,
  ProvisioningAssociationStep,
  ProvisioningObjectStep,
  ProvisioningPropertyStep,
  ProvisioningProposedAction,
  ProvisioningTaskStep,
  ProvisioningValidationResult,
} from "@/src/types/provisioning-plan";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import {
  fetchHubSpotCustomSchemaSnapshot,
  resolveCustomObjectInSnapshot,
  type HubSpotCustomSchemaSnapshot,
  type HubSpotCustomObjectSnapshot,
} from "@/src/lib/provisioning/hubspot-custom-schema-snapshot";
import { getStandardObjectTypeId } from "@/src/lib/hubspot/standard-object-type-ids";
import { getStoredClientAppMappingPreview } from "@/src/lib/platform/client-app-mapping-store";
import { resolveAssociationTypeIdFromSnapshot } from "@/src/lib/provisioning/association-snapshot-resolution";

export async function buildDryRunInstallPlan(
  clientId: string,
  blueprintId: string,
): Promise<ProvisioningInstallPlan> {
  const blueprint = getBlueprintById(blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown blueprint: ${blueprintId}`);
  }

  const tokenConfigured = isHubSpotAccessTokenConfigured();
  let snapshot: HubSpotCustomSchemaSnapshot = {
    objectsBySchemaName: new Map(),
    objectsByObjectTypeId: new Map(),
  };
  let snapshotError: string | undefined;

  if (tokenConfigured) {
    snapshot = await fetchHubSpotCustomSchemaSnapshot();
    snapshotError = snapshot.rawError;
  }

  const hubspotSnapshotAvailable = tokenConfigured && !snapshotError;

  const objectSteps = buildObjectSteps(blueprint, snapshot);
  const propertySteps = buildPropertySteps(blueprint, snapshot);
  const associationSteps = buildAssociationSteps(blueprint, snapshot);

  const validations = runValidations(blueprint, {
    tokenConfigured,
    snapshotError,
  });

  const tasks: ProvisioningTaskStep[] = blueprint.setupTasks.map((t) => ({
    taskId: t.id,
    title: t.title,
    optional: t.optional,
    status: "pending" as const,
  }));

  const proposedActions = buildProposedActions(
    blueprint,
    objectSteps,
    propertySteps,
    associationSteps,
    tasks,
  );

  const storedMapping = getStoredClientAppMappingPreview(clientId, blueprint.appKey);
  const mappingPreview = buildMappingPreview(blueprint, snapshot, storedMapping);

  return {
    mode: "dry-run",
    clientId,
    blueprintId,
    blueprint,
    hubspotSnapshotAvailable,
    hubspotSnapshotError: snapshotError,
    objects: objectSteps,
    properties: propertySteps,
    associations: associationSteps,
    validations,
    tasks,
    proposedActions,
    mappingPreview,
  };
}

function buildObjectSteps(
  blueprint: AppInstallBlueprint,
  snapshot: HubSpotCustomSchemaSnapshot,
): ProvisioningObjectStep[] {
  return blueprint.customObjects.map((obj) => {
    const live = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
    if (!live) {
      return {
        blueprintObjectKey: obj.objectKey,
        schemaName: obj.schemaName,
        singularLabel: obj.singularLabel,
        status: "missing" as const,
        detail: "Custom object schema not found in this HubSpot account.",
      };
    }
    return {
      blueprintObjectKey: obj.objectKey,
      schemaName: obj.schemaName,
      singularLabel: obj.singularLabel,
      status: "present" as const,
      hubspotObjectTypeId: live.objectTypeId,
    };
  });
}

function buildPropertySteps(
  blueprint: AppInstallBlueprint,
  snapshot: HubSpotCustomSchemaSnapshot,
): ProvisioningPropertyStep[] {
  const steps: ProvisioningPropertyStep[] = [];

  for (const obj of blueprint.customObjects) {
    const live = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
    for (const prop of obj.requiredProperties) {
      if (!live) {
        steps.push({
          blueprintObjectKey: obj.objectKey,
          propertyName: prop.name,
          label: prop.label,
          status: "missing",
          expectedValueType: prop.valueType,
          expectedFieldType: prop.fieldType,
          detail: "Parent object schema is missing; properties cannot be verified.",
        });
        continue;
      }

      const existing = live.properties.get(prop.name);
      if (!existing) {
        steps.push({
          blueprintObjectKey: obj.objectKey,
          propertyName: prop.name,
          label: prop.label,
          status: "missing",
          expectedValueType: prop.valueType,
          expectedFieldType: prop.fieldType,
        });
        continue;
      }

      const typeOk =
        !existing.type ||
        existing.type === prop.valueType ||
        prop.valueType === "number"; // HubSpot may report enumeration differently
      const fieldOk =
        !existing.fieldType || existing.fieldType === prop.fieldType;

      if (!typeOk || !fieldOk) {
        steps.push({
          blueprintObjectKey: obj.objectKey,
          propertyName: prop.name,
          label: prop.label,
          status: "partial",
          expectedValueType: prop.valueType,
          expectedFieldType: prop.fieldType,
          actualValueType: existing.type,
          actualFieldType: existing.fieldType,
          detail: "Property exists but type/fieldType may not match blueprint.",
        });
      } else {
        steps.push({
          blueprintObjectKey: obj.objectKey,
          propertyName: prop.name,
          label: prop.label,
          status: "present",
          expectedValueType: prop.valueType,
          expectedFieldType: prop.fieldType,
          actualValueType: existing.type,
          actualFieldType: existing.fieldType,
        });
      }
    }
  }

  return steps;
}

function resolveObjectTypeId(
  ref: BlueprintObjectRef,
  _blueprint: AppInstallBlueprint,
  byKey: Map<string, HubSpotCustomObjectSnapshot>,
): string | undefined {
  if (ref.kind === "hubspot_standard") {
    return getStandardObjectTypeId(ref.objectType);
  }
  return byKey.get(ref.objectKey)?.objectTypeId;
}

function associationPresentBetween(
  fromSnapshot: HubSpotCustomObjectSnapshot | undefined,
  toTypeId: string | undefined,
): boolean {
  if (!fromSnapshot || !toTypeId) return false;
  const a = fromSnapshot.objectTypeId;
  return fromSnapshot.associations.some((edge) => {
    const from = edge.fromObjectTypeId;
    const to = edge.toObjectTypeId;
    if (!from || !to) return false;
    return (
      (from === a && to === toTypeId) ||
      (to === a && from === toTypeId) ||
      (from === toTypeId && to === a)
    );
  });
}

function buildAssociationSteps(
  blueprint: AppInstallBlueprint,
  snapshot: HubSpotCustomSchemaSnapshot,
): ProvisioningAssociationStep[] {
  const byKey = new Map<string, HubSpotCustomObjectSnapshot>();
  for (const obj of blueprint.customObjects) {
    const live = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
    if (live) byKey.set(obj.objectKey, live);
  }

  return blueprint.associations.map((assoc: BlueprintAssociationDefinition) => {
    const fromType = resolveObjectTypeId(assoc.from, blueprint, byKey);
    const toType = resolveObjectTypeId(assoc.to, blueprint, byKey);

    const fromLabel = labelForRef(assoc.from, blueprint);
    const toLabel = labelForRef(assoc.to, blueprint);

    if (!fromType || !toType) {
      return {
        associationId: assoc.id,
        description: assoc.description,
        status: "unknown" as const,
        fromLabel,
        toLabel,
        detail: "One or both object types could not be resolved (missing schema?).",
      };
    }

    const fromSnapshot =
      assoc.from.kind === "blueprint_custom"
        ? byKey.get(assoc.from.objectKey)
        : undefined;
    const toSnapshot =
      assoc.to.kind === "blueprint_custom" ? byKey.get(assoc.to.objectKey) : undefined;

    let ok = false;
    if (fromSnapshot) {
      ok = associationPresentBetween(fromSnapshot, toType);
    }
    if (!ok && toSnapshot) {
      ok = associationPresentBetween(toSnapshot, fromType);
    }

    return {
      associationId: assoc.id,
      description: assoc.description,
      status: ok ? ("present" as const) : ("missing" as const),
      fromLabel,
      toLabel,
      detail: ok
        ? undefined
        : "No matching association edge found on the custom object schema snapshot.",
    };
  });
}

function labelForRef(
  ref: BlueprintObjectRef,
  blueprint: AppInstallBlueprint,
): string {
  if (ref.kind === "hubspot_standard") return ref.objectType;
  const def = blueprint.customObjects.find((o) => o.objectKey === ref.objectKey);
  return def?.singularLabel ?? ref.objectKey;
}

function runValidations(
  blueprint: AppInstallBlueprint,
  ctx: { tokenConfigured: boolean; snapshotError?: string },
): ProvisioningValidationResult[] {
  return blueprint.validationChecks.map((check) => {
    if (check.id === "private-app-token") {
      return {
        checkId: check.id,
        description: check.description,
        severity: check.severity,
        passed: ctx.tokenConfigured,
        message: ctx.tokenConfigured ? undefined : "Set HUBSPOT_ACCESS_TOKEN in .env.local",
      };
    }
    if (check.id === "schema-api-reachable") {
      const passed = ctx.tokenConfigured && !ctx.snapshotError;
      return {
        checkId: check.id,
        description: check.description,
        severity: check.severity,
        passed,
        message: ctx.snapshotError,
      };
    }
    if (check.id === "no-destructive-mutation-in-dry-run") {
      return {
        checkId: check.id,
        description: check.description,
        severity: check.severity,
        passed: true,
        message: "Dry-run only: no HubSpot mutations are invoked from this plan builder.",
      };
    }
    return {
      checkId: check.id,
      description: check.description,
      severity: check.severity,
      passed: true,
    };
  });
}

function buildProposedActions(
  blueprint: AppInstallBlueprint,
  objects: ProvisioningObjectStep[],
  properties: ProvisioningPropertyStep[],
  associations: ProvisioningAssociationStep[],
  tasks: ProvisioningTaskStep[],
): ProvisioningProposedAction[] {
  const actions: ProvisioningProposedAction[] = [];

  for (const o of objects) {
    if (o.status === "missing") {
      const def = blueprint.customObjects.find((c) => c.objectKey === o.blueprintObjectKey);
      if (def) {
        actions.push({
          kind: "create_custom_object_schema",
          schemaName: def.schemaName,
          labels: { singular: def.singularLabel, plural: def.pluralLabel },
        });
      }
    }
  }

  for (const p of properties) {
    if (p.status === "missing" || p.status === "partial") {
      const def = blueprint.customObjects.find((c) => c.objectKey === p.blueprintObjectKey);
      if (def) {
        actions.push({
          kind: "create_property",
          objectTypeTarget: def.schemaName,
          property: p.propertyName,
        });
      }
    }
  }

  for (const a of associations) {
    if (a.status === "missing" || a.status === "unknown") {
      actions.push({ kind: "create_association", associationId: a.associationId });
    }
  }

  for (const t of tasks) {
    actions.push({
      kind: "manual_setup_task",
      taskId: t.taskId,
      title: t.title,
    });
  }

  return actions;
}

function buildMappingPreview(
  blueprint: AppInstallBlueprint,
  snapshot: HubSpotCustomSchemaSnapshot,
  stored: Record<string, string> | null,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};

  const objectTypeIdByBlueprintKey: Record<string, string> = {};
  for (const obj of blueprint.customObjects) {
    const live = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
    if (live) {
      objectTypeIdByBlueprintKey[obj.objectKey] = live.objectTypeId;
    }
  }

  for (const mk of blueprint.mappingKeys) {
    const storedVal = stored?.[mk.key];
    if (storedVal) {
      out[mk.key] = storedVal;
      continue;
    }

    const src = mk.source;
    if (src.type === "blueprint_object") {
      const def = blueprint.customObjects.find((o) => o.objectKey === src.objectKey);
      const live = def ? resolveCustomObjectInSnapshot(snapshot, { schemaName: def.schemaName }) : undefined;
      out[mk.key] = live?.objectTypeId ?? null;
      continue;
    }

    if (src.type === "blueprint_property") {
      const def = blueprint.customObjects.find((o) => o.objectKey === src.objectKey);
      const live = def ? resolveCustomObjectInSnapshot(snapshot, { schemaName: def.schemaName }) : undefined;
      const prop = live?.properties.get(src.propertyName);
      out[mk.key] = prop ? src.propertyName : null;
      continue;
    }

    if (src.type === "blueprint_association") {
      out[mk.key] =
        resolveAssociationTypeIdFromSnapshot(
          blueprint,
          src.associationId,
          snapshot,
          objectTypeIdByBlueprintKey,
        ) ?? null;
      continue;
    }

    out[mk.key] = null;
  }

  return out;
}
