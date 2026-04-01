import "server-only";

import { hubspotApiGetJson } from "@/src/lib/hubspot/http";

export interface HubSpotCustomSchemaPropertySnapshot {
  name: string;
  type?: string;
  fieldType?: string;
  label?: string;
}

export interface HubSpotCustomSchemaAssociationSnapshot {
  fromObjectTypeId?: string;
  toObjectTypeId?: string;
  name?: string;
  /** HubSpot association type id when returned by schema APIs */
  associationTypeId?: string;
}

export interface HubSpotCustomObjectSnapshot {
  schemaName: string;
  objectTypeId: string;
  singularLabel: string;
  pluralLabel: string;
  /** HubSpot record title source (e.g. entry_name vs rank). */
  primaryDisplayProperty?: string;
  properties: Map<string, HubSpotCustomSchemaPropertySnapshot>;
  associations: HubSpotCustomSchemaAssociationSnapshot[];
}

export interface HubSpotCustomSchemaSnapshot {
  objectsBySchemaName: Map<string, HubSpotCustomObjectSnapshot>;
  /** Index by HubSpot CRM object type id (e.g. `2-60119441`) — same value as v3 records path. */
  objectsByObjectTypeId: Map<string, HubSpotCustomObjectSnapshot>;
  rawError?: string;
}

type SchemasResponse = {
  results?: HubSpotSchemaRaw[];
};

type HubSpotSchemaRaw = {
  name: string;
  objectTypeId?: string;
  /** Some HubSpot responses use this in addition to `name`. */
  fullyQualifiedName?: string;
  labels?: { singular?: string; plural?: string };
  primaryDisplayProperty?: string;
  properties?: HubSpotPropertyRaw[];
  associations?: HubSpotAssociationRaw[];
  associationDefinitions?: HubSpotAssociationRaw[];
};

type HubSpotPropertyRaw = {
  name: string;
  type?: string;
  fieldType?: string;
  label?: string;
};

type HubSpotAssociationRaw = {
  fromObjectTypeId?: string;
  toObjectTypeId?: string;
  name?: string;
  id?: string;
  typeId?: string;
};

export interface ResolveCustomObjectCriteria {
  /** Blueprint / intended schema name (e.g. search_board_candidate). */
  schemaName: string;
  /** Prefer match from create response. */
  objectTypeIdHint?: string;
  /** Extra name keys to try against `objectsBySchemaName` (API name, FQN, etc.). */
  alternateKeys?: string[];
}

/**
 * Find a custom object in a snapshot. Order: objectTypeId index → schema name → alternate keys → scan by id.
 */
export function resolveCustomObjectInSnapshot(
  snapshot: HubSpotCustomSchemaSnapshot,
  criteria: ResolveCustomObjectCriteria,
): HubSpotCustomObjectSnapshot | undefined {
  const hint = criteria.objectTypeIdHint?.trim();
  if (hint) {
    const byId = snapshot.objectsByObjectTypeId.get(hint);
    if (byId) {
      return byId;
    }
  }

  const bySchema = snapshot.objectsBySchemaName.get(criteria.schemaName);
  if (bySchema) {
    return bySchema;
  }

  for (const alt of criteria.alternateKeys ?? []) {
    const k = alt?.trim();
    if (!k) continue;
    const hit = snapshot.objectsBySchemaName.get(k);
    if (hit) {
      return hit;
    }
  }

  if (hint) {
    for (const [, snap] of snapshot.objectsBySchemaName) {
      if (snap.objectTypeId === hint) {
        return snap;
      }
    }
  }

  return undefined;
}

/** Summarize snapshot for install diagnostics (no PII). */
export function describeHubSpotSchemaSnapshot(snapshot: HubSpotCustomSchemaSnapshot): string {
  const parts: string[] = [];
  for (const [key, o] of snapshot.objectsBySchemaName) {
    parts.push(`${key}→${o.objectTypeId}`);
  }
  return `count=${snapshot.objectsBySchemaName.size}${parts.length ? `; ${parts.join(" | ")}` : ""}`;
}

function emptySnapshot(message?: string): HubSpotCustomSchemaSnapshot {
  return {
    objectsBySchemaName: new Map(),
    objectsByObjectTypeId: new Map(),
    ...(message ? { rawError: message } : {}),
  };
}

/**
 * Loads custom object schemas from HubSpot (read-only).
 * Indexes each row by `name`, optional `fullyQualifiedName`, and `objectTypeId`.
 */
export async function fetchHubSpotCustomSchemaSnapshot(): Promise<HubSpotCustomSchemaSnapshot> {
  const primary = await hubspotApiGetJson<SchemasResponse>(
    "/crm/v3/schemas?archived=false",
  );
  const res = primary.ok
    ? primary
    : await hubspotApiGetJson<SchemasResponse>("/crm-object-schemas/v3/schemas?archived=false");

  if (!res.ok) {
    return emptySnapshot(res.message);
  }

  const objectsBySchemaName = new Map<string, HubSpotCustomObjectSnapshot>();
  const objectsByObjectTypeId = new Map<string, HubSpotCustomObjectSnapshot>();

  const indexSnapshot = (key: string, snap: HubSpotCustomObjectSnapshot) => {
    if (!key) return;
    objectsBySchemaName.set(key, snap);
  };

  for (const row of res.data.results ?? []) {
    const props = new Map<string, HubSpotCustomSchemaPropertySnapshot>();
    for (const p of row.properties ?? []) {
      props.set(p.name, {
        name: p.name,
        type: p.type,
        fieldType: p.fieldType,
        label: p.label,
      });
    }
    const assocRaw = row.associations ?? row.associationDefinitions ?? [];
    const associations: HubSpotCustomSchemaAssociationSnapshot[] = assocRaw.map((a) => ({
      fromObjectTypeId: a.fromObjectTypeId,
      toObjectTypeId: a.toObjectTypeId,
      name: a.name,
      associationTypeId: a.id ?? a.typeId,
    }));

    const objectTypeId = (row.objectTypeId ?? row.name).trim();
    const snap: HubSpotCustomObjectSnapshot = {
      schemaName: row.name,
      objectTypeId,
      singularLabel: row.labels?.singular ?? row.name,
      pluralLabel: row.labels?.plural ?? row.name,
      primaryDisplayProperty: row.primaryDisplayProperty,
      properties: props,
      associations,
    };

    indexSnapshot(row.name, snap);
    const fqn = row.fullyQualifiedName?.trim();
    if (fqn && fqn !== row.name) {
      indexSnapshot(fqn, snap);
    }

    if (objectTypeId) {
      objectsByObjectTypeId.set(objectTypeId, snap);
    }
  }

  return { objectsBySchemaName, objectsByObjectTypeId };
}
