import "server-only";

import { getBlueprintById } from "@/src/config/blueprints/registry";
import type {
  AppInstallBlueprint,
  BlueprintAssociationDefinition,
  BlueprintObjectRef,
  BlueprintPropertyDefinition,
} from "@/src/types/app-install-blueprint";
import type { SearchBoardInstallReport } from "@/src/types/search-board-install-report";
import { getStandardObjectTypeId } from "@/src/lib/hubspot/standard-object-type-ids";
import {
  blueprintPropertyToHubSpotPayload,
  hubspotCreateCustomObjectSchema,
  hubspotCreateProperty,
  hubspotCreatePropertyGroup,
  hubspotCreateSchemaAssociation,
  hubspotListPropertyGroups,
  hubspotPatchCustomObjectSchemaPrimaryDisplay,
  hubspotPatchProperty,
  isHubSpotDuplicateError,
  type HubSpotSchemaCreateBody,
  type HubSpotSchemaCreateResult,
} from "@/src/lib/hubspot/schema-api";
import {
  describeHubSpotSchemaSnapshot,
  fetchHubSpotCustomSchemaSnapshot,
  resolveCustomObjectInSnapshot,
  type HubSpotCustomObjectSnapshot,
  type HubSpotCustomSchemaPropertySnapshot,
  type HubSpotCustomSchemaSnapshot,
} from "@/src/lib/provisioning/hubspot-custom-schema-snapshot";
const ZERO_COUNTS: SearchBoardInstallReport["counts"] = {
  schemasCreated: 0,
  schemasSkipped: 0,
  groupsCreated: 0,
  groupsSkipped: 0,
  propertiesCreated: 0,
  propertiesSkipped: 0,
  associationsCreated: 0,
  associationsSkipped: 0,
};

function associationEdgeExists(
  fromSnap: HubSpotCustomObjectSnapshot | undefined,
  peerTypeId: string,
): boolean {
  if (!fromSnap || !peerTypeId) return false;
  const self = fromSnap.objectTypeId;
  return fromSnap.associations.some((edge) => {
    const from = edge.fromObjectTypeId;
    const to = edge.toObjectTypeId;
    if (!from || !to) return false;
    return (
      (from === self && to === peerTypeId) ||
      (to === self && from === peerTypeId) ||
      (from === peerTypeId && to === self)
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Five waits between resolution attempts: ~1s, 2s, 3s, 3s, 3s (six tries total including first). */
const SNAPSHOT_RETRY_DELAYS_MS = [1000, 2000, 3000, 3000, 3000];

async function resolveSchemaAfterCreateWithRetries(
  snapshotStart: HubSpotCustomSchemaSnapshot,
  blueprintObj: AppInstallBlueprint["customObjects"][number],
  createResult: HubSpotSchemaCreateResult | null,
  log: string[],
): Promise<{ snapshot: HubSpotCustomSchemaSnapshot; live: HubSpotCustomObjectSnapshot | undefined }> {
  let current = snapshotStart;
  const alternateKeys = [createResult?.name, createResult?.fullyQualifiedName].filter(
    (x): x is string => Boolean(x?.trim()),
  );

  const searchLabel = [
    `schemaName=${blueprintObj.schemaName}`,
    createResult?.objectTypeId ? `objectTypeId=${createResult.objectTypeId}` : null,
    createResult?.name ? `apiName=${createResult.name}` : null,
    createResult?.fullyQualifiedName ? `fqn=${createResult.fullyQualifiedName}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  for (let attempt = 0; attempt <= SNAPSHOT_RETRY_DELAYS_MS.length; attempt++) {
    const resolved = resolveCustomObjectInSnapshot(current, {
      schemaName: blueprintObj.schemaName,
      objectTypeIdHint: createResult?.objectTypeId,
      alternateKeys,
    });

    log.push(
      `[verify ${blueprintObj.schemaName}] attempt ${attempt + 1}/${SNAPSHOT_RETRY_DELAYS_MS.length + 1}: ${describeHubSpotSchemaSnapshot(current)}`,
    );

    if (resolved) {
      log.push(
        `Resolved "${blueprintObj.schemaName}" in snapshot (attempt ${attempt + 1}); objectTypeId=${resolved.objectTypeId}`,
      );
      return { snapshot: current, live: resolved };
    }

    const keys = [...current.objectsBySchemaName.keys()];
    const ids = [...current.objectsByObjectTypeId.keys()];
    log.push(
      `Not found yet; searched: ${searchLabel}. snapshot schema keys: [${keys.join(", ") || "none"}]; objectTypeIds: [${ids.join(", ") || "none"}]`,
    );

    if (attempt < SNAPSHOT_RETRY_DELAYS_MS.length) {
      const wait = SNAPSHOT_RETRY_DELAYS_MS[attempt];
      log.push(`Waiting ${wait}ms before snapshot refetch...`);
      await sleep(wait);
      const next = await fetchHubSpotCustomSchemaSnapshot();
      if (next.rawError) {
        log.push(`Snapshot refetch failed: ${next.rawError}`);
        return { snapshot: current, live: undefined };
      }
      current = next;
    }
  }

  return { snapshot: current, live: undefined };
}

function provisionalLiveFromCreateResponse(
  blueprintObj: AppInstallBlueprint["customObjects"][number],
  data: HubSpotSchemaCreateResult,
  primary: BlueprintPropertyDefinition,
): HubSpotCustomObjectSnapshot | null {
  const id = data.objectTypeId?.trim();
  if (!id) return null;
  const props = new Map<string, HubSpotCustomSchemaPropertySnapshot>();
  props.set(primary.name, {
    name: primary.name,
    type: primary.valueType,
    fieldType: primary.fieldType,
    label: primary.label,
  });
  return {
    schemaName: blueprintObj.schemaName,
    objectTypeId: id,
    singularLabel: data.labels?.singular ?? blueprintObj.singularLabel,
    pluralLabel: data.labels?.plural ?? blueprintObj.pluralLabel,
    primaryDisplayProperty: primary.name,
    properties: props,
    associations: [],
  };
}

/** Idempotent Search Board install: creates schemas, groups, properties, associations in HubSpot. */
export async function executeSearchBoardLiveInstall(): Promise<SearchBoardInstallReport> {
  const startedAt = new Date().toISOString();
  const log: string[] = [];
  const counts = { ...ZERO_COUNTS };

  const blueprint = getBlueprintById("search-board");
  if (!blueprint) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      failedStep: "blueprint",
      hubspotMessage: "Search Board blueprint not registered.",
      counts,
      log: ["Search Board blueprint not registered."],
      objectTypeIds: {},
    };
  }

  const searchBoard: AppInstallBlueprint = blueprint;

  let snapshot = await fetchHubSpotCustomSchemaSnapshot();
  if (snapshot.rawError) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      failedStep: "hubspot_snapshot",
      hubspotMessage: snapshot.rawError,
      counts,
      log: [`Snapshot failed: ${snapshot.rawError}`],
      objectTypeIds: {},
    };
  }

  const fail = (
    message: string,
    step: string,
    status?: number,
  ): SearchBoardInstallReport => {
    log.push(`ERROR [${step}]: ${message}`);
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      failedStep: step,
      httpStatus: status,
      hubspotMessage: message,
      counts,
      log,
      objectTypeIds: collectObjectTypeIds(searchBoard.customObjects.map((o) => o.objectKey), snapshot),
    };
  };

  try {
    for (const obj of searchBoard.customObjects) {
      const stepBase = `schema:${obj.schemaName}`;
      let live = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
      let stableObjectTypeId: string | undefined = live?.objectTypeId;
      let primaryResolved: BlueprintPropertyDefinition | undefined;

      if (!live) {
        primaryResolved = obj.requiredProperties.find((p) => p.name === obj.primaryDisplayProperty);
        if (!primaryResolved) {
          return fail(
            `primaryDisplayProperty "${obj.primaryDisplayProperty}" missing on object ${obj.objectKey}`,
            stepBase,
          );
        }

        const body: HubSpotSchemaCreateBody = {
          name: obj.schemaName,
          labels: { singular: obj.singularLabel, plural: obj.pluralLabel },
          description: obj.description,
          primaryDisplayProperty: primaryResolved.name,
          requiredProperties: [primaryResolved.name],
          searchableProperties: [primaryResolved.name],
          properties: [blueprintPropertyToHubSpotPayload(primaryResolved)],
        };

        const created = await hubspotCreateCustomObjectSchema(body);
        if (!created.ok) {
          if (isHubSpotDuplicateError(created.status, created.message)) {
            counts.schemasSkipped++;
            log.push(
              `Schema ${obj.schemaName} already exists (HubSpot). Resolving with snapshot retries.`,
            );
            const afterDup = await fetchHubSpotCustomSchemaSnapshot();
            if (afterDup.rawError) {
              return fail(afterDup.rawError, `${stepBase}_refresh`);
            }
            const dupResolve = await resolveSchemaAfterCreateWithRetries(afterDup, obj, null, log);
            snapshot = dupResolve.snapshot;
            live = dupResolve.live;
            if (!live) {
              return fail(
                `Schema "${obj.schemaName}" could not be resolved after duplicate/conflict. ${describeHubSpotSchemaSnapshot(snapshot)}`,
                stepBase,
              );
            }
          } else {
            return fail(created.message, stepBase, created.status);
          }
        } else {
          counts.schemasCreated++;
          const d = created.data;
          log.push(
            `POST schema create OK "${obj.schemaName}": objectTypeId=${d.objectTypeId ?? "(none)"}, name=${d.name ?? "(none)"}, fullyQualifiedName=${d.fullyQualifiedName ?? "(none)"}, labels=${d.labels ? JSON.stringify(d.labels) : "(none)"}`,
          );

          const postCreate = await fetchHubSpotCustomSchemaSnapshot();
          if (postCreate.rawError) {
            return fail(postCreate.rawError, `${stepBase}_post_create_snapshot`);
          }
          log.push(`Post-create snapshot: ${describeHubSpotSchemaSnapshot(postCreate)}`);

          const verify = await resolveSchemaAfterCreateWithRetries(postCreate, obj, d, log);
          snapshot = verify.snapshot;
          live = verify.live;

          if (!live && d.objectTypeId?.trim()) {
            const prov = provisionalLiveFromCreateResponse(obj, d, primaryResolved);
            if (prov) {
              live = prov;
              log.push(
                `Snapshot lag: continuing with provisional object (objectTypeId=${live.objectTypeId}); properties reconcile on refetch.`,
              );
            }
          }

          if (!live) {
            return fail(
              `Schema "${obj.schemaName}": create OK but no objectTypeId usable and not in snapshot after retries. ${describeHubSpotSchemaSnapshot(snapshot)}`,
              stepBase,
            );
          }
        }
      } else {
        counts.schemasSkipped++;
        log.push(`Schema "${obj.schemaName}" already present (objectTypeId ${live.objectTypeId})`);
        const desiredPrimary = obj.primaryDisplayProperty.trim();
        const currentPrimary = live.primaryDisplayProperty?.trim() ?? "";
        if (
          currentPrimary !== desiredPrimary &&
          live.properties.has(desiredPrimary)
        ) {
          const patch = await hubspotPatchCustomObjectSchemaPrimaryDisplay(
            live.objectTypeId,
            desiredPrimary,
          );
          if (patch.ok) {
            log.push(
              `PATCH primaryDisplayProperty "${obj.schemaName}": ${currentPrimary || "(unset)"} → ${desiredPrimary}`,
            );
            const after = await fetchHubSpotCustomSchemaSnapshot();
            if (!after.rawError) {
              snapshot = after;
              const refreshed = resolveCustomObjectInSnapshot(after, {
                schemaName: obj.schemaName,
              });
              if (refreshed) {
                live = refreshed;
              }
            }
          } else {
            log.push(
              `WARN: primaryDisplayProperty PATCH failed for ${obj.schemaName}: ${patch.message}`,
            );
          }
        }
      }

      const primary =
        primaryResolved ??
        obj.requiredProperties.find((p) => p.name === obj.primaryDisplayProperty);
      if (!primary) {
        return fail(
          `primaryDisplayProperty "${obj.primaryDisplayProperty}" missing on object ${obj.objectKey}`,
          stepBase,
        );
      }

      stableObjectTypeId = live.objectTypeId;

      let objectTypeId = live.objectTypeId;
      const pg = obj.propertyGroup;

      const groupsRes = await hubspotListPropertyGroups(objectTypeId);
      if (!groupsRes.ok) {
        return fail(groupsRes.message, `property_groups:${obj.schemaName}`, groupsRes.status);
      }

      const hasGroup = groupsRes.data.results?.some((g) => g.name === pg.name);
      if (!hasGroup) {
        const gRes = await hubspotCreatePropertyGroup(objectTypeId, {
          name: pg.name,
          label: pg.label,
          displayOrder: 0,
        });
        if (!gRes.ok) {
          if (isHubSpotDuplicateError(gRes.status, gRes.message)) {
            counts.groupsSkipped++;
            log.push(`Property group "${pg.label}" already exists (race)`);
          } else {
            return fail(gRes.message, `property_group_create:${obj.schemaName}`, gRes.status);
          }
        } else {
          counts.groupsCreated++;
          log.push(`Created property group "${pg.label}" (${pg.name})`);
        }
      } else {
        counts.groupsSkipped++;
        log.push(`Property group "${pg.label}" already exists`);
      }

      for (const prop of obj.requiredProperties) {
        snapshot = await fetchHubSpotCustomSchemaSnapshot();
        if (snapshot.rawError) {
          return fail(snapshot.rawError, `snapshot:${obj.schemaName}.${prop.name}`);
        }
        const previousLive = live;
        const fromSnapshot = resolveCustomObjectInSnapshot(snapshot, {
          schemaName: obj.schemaName,
          objectTypeIdHint: stableObjectTypeId,
        });
        const merged: HubSpotCustomObjectSnapshot = fromSnapshot ?? previousLive;
        if (!merged.objectTypeId) {
          return fail(
            `Lost schema "${obj.schemaName}" during property install (${prop.name}); had stable id ${stableObjectTypeId ?? "?"}. ${describeHubSpotSchemaSnapshot(snapshot)}`,
            `property:${prop.name}`,
          );
        }
        live = merged;
        objectTypeId = live.objectTypeId;

        if (live.properties.has(prop.name)) {
          counts.propertiesSkipped++;
          log.push(`Property "${prop.name}" already on ${obj.schemaName}`);
          continue;
        }

        const payload = blueprintPropertyToHubSpotPayload(prop, prop.groupName ?? pg.name);
        const pRes = await hubspotCreateProperty(objectTypeId, payload);
        if (!pRes.ok) {
          if (isHubSpotDuplicateError(pRes.status, pRes.message)) {
            counts.propertiesSkipped++;
            log.push(`Property "${prop.name}" already exists (race), skipped`);
            continue;
          }
          return fail(pRes.message, `property:${obj.schemaName}.${prop.name}`, pRes.status);
        }
        counts.propertiesCreated++;
        log.push(`Created property "${obj.schemaName}.${prop.name}"`);
      }

      const patchRes = await hubspotPatchProperty(objectTypeId, primary.name, {
        groupName: pg.name,
      });
      if (patchRes.ok) {
        log.push(`Set primary "${primary.name}" property group to ${pg.name}`);
      }

      snapshot = await fetchHubSpotCustomSchemaSnapshot();
      if (snapshot.rawError) {
        return fail(snapshot.rawError, `post_object_refresh:${obj.schemaName}`);
      }
    }

    snapshot = await fetchHubSpotCustomSchemaSnapshot();
    if (snapshot.rawError) {
      return fail(snapshot.rawError, "pre_association_snapshot");
    }

    let byKey = buildByKeyMap(searchBoard, snapshot);

    function resolveTypeId(ref: BlueprintObjectRef): string | undefined {
      if (ref.kind === "hubspot_standard") {
        return getStandardObjectTypeId(ref.objectType);
      }
      const def = searchBoard.customObjects.find((o) => o.objectKey === ref.objectKey);
      if (!def) return undefined;
      return resolveCustomObjectInSnapshot(snapshot, { schemaName: def.schemaName })?.objectTypeId;
    }

    for (const assoc of searchBoard.associations) {
      const stepLabel = `association:${assoc.id}`;
      const fromType = resolveTypeId(assoc.from);
      const toType = resolveTypeId(assoc.to);
      if (!fromType || !toType) {
        log.push(
          `Skipped association ${assoc.id}: unresolved type (from=${fromType ?? "?"}, to=${toType ?? "?"})`,
        );
        continue;
      }

      const fromSnap =
        assoc.from.kind === "blueprint_custom"
          ? byKey.get(assoc.from.objectKey)
          : undefined;
      const toSnap =
        assoc.to.kind === "blueprint_custom" ? byKey.get(assoc.to.objectKey) : undefined;

      let present = false;
      if (fromSnap) {
        present = associationEdgeExists(fromSnap, toType);
      }
      if (!present && toSnap) {
        present = associationEdgeExists(toSnap, fromType);
      }

      if (present) {
        counts.associationsSkipped++;
        log.push(`Association "${assoc.id}" already defined in HubSpot`);
        continue;
      }

      if (assoc.from.kind !== "blueprint_custom") {
        log.push(`Association "${assoc.id}" skipped: installer posts from custom object only`);
        continue;
      }

      const associationName = associationApiName(assoc);
      const aRes = await hubspotCreateSchemaAssociation(fromType, {
        fromObjectTypeId: fromType,
        toObjectTypeId: toType,
        name: associationName,
      });

      if (!aRes.ok) {
        if (isHubSpotDuplicateError(aRes.status, aRes.message)) {
          counts.associationsSkipped++;
          log.push(`Association "${assoc.id}" already exists (race), skipped`);
          continue;
        }
        return fail(aRes.message, stepLabel, aRes.status);
      }

      counts.associationsCreated++;
      log.push(
        `Created association "${assoc.id}" name=${associationName} (${fromType} ↔ ${toType})`,
      );

      snapshot = await fetchHubSpotCustomSchemaSnapshot();
      if (snapshot.rawError) {
        return fail(snapshot.rawError, "refresh_after_association");
      }
      byKey = buildByKeyMap(searchBoard, snapshot);
    }

    const finishedAt = new Date().toISOString();
    const objectTypeIds = collectObjectTypeIds(
      searchBoard.customObjects.map((o) => o.objectKey),
      snapshot,
    );

    log.push("Install run completed successfully.");
    return {
      startedAt,
      finishedAt,
      ok: true,
      counts,
      log,
      objectTypeIds,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.push(`Unexpected error: ${msg}`);
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      failedStep: "unexpected",
      hubspotMessage: msg,
      counts,
      log,
      objectTypeIds: collectObjectTypeIdsFromBlueprint(snapshot),
    };
  }
}

function associationApiName(assoc: BlueprintAssociationDefinition): string {
  return assoc.id.replace(/-/g, "_");
}

function buildByKeyMap(
  blueprint: AppInstallBlueprint,
  snapshot: HubSpotCustomSchemaSnapshot,
): Map<string, HubSpotCustomObjectSnapshot> {
  const byKey = new Map<string, HubSpotCustomObjectSnapshot>();
  for (const obj of blueprint.customObjects) {
    const s = resolveCustomObjectInSnapshot(snapshot, { schemaName: obj.schemaName });
    if (s) {
      byKey.set(obj.objectKey, s);
    }
  }
  return byKey;
}

function collectObjectTypeIds(keys: string[], snapshot: HubSpotCustomSchemaSnapshot): Record<string, string> {
  const bp = getBlueprintById("search-board");
  const out: Record<string, string> = {};
  if (!bp) return out;
  for (const key of keys) {
    const def = bp.customObjects.find((o) => o.objectKey === key);
    if (!def) continue;
    const resolved = resolveCustomObjectInSnapshot(snapshot, { schemaName: def.schemaName });
    if (resolved?.objectTypeId) {
      out[key] = resolved.objectTypeId;
    }
  }
  return out;
}

function collectObjectTypeIdsFromBlueprint(snapshot: HubSpotCustomSchemaSnapshot): Record<string, string> {
  const bp = getBlueprintById("search-board");
  if (!bp) return {};
  return collectObjectTypeIds(
    bp.customObjects.map((o) => o.objectKey),
    snapshot,
  );
}
