import "server-only";

import type { BlueprintPropertyDefinition } from "@/src/types/app-install-blueprint";
import { hubspotApiGetJson, hubspotApiSendJson, type HubSpotJsonResult } from "@/src/lib/hubspot/http";

export type HubSpotSchemaCreateBody = {
  name: string;
  labels: { singular: string; plural: string };
  description?: string;
  primaryDisplayProperty: string;
  requiredProperties: string[];
  searchableProperties: string[];
  properties: Record<string, unknown>[];
};

export function blueprintPropertyToHubSpotPayload(
  prop: BlueprintPropertyDefinition,
  groupName?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: prop.name,
    label: prop.label,
    type: prop.valueType,
    fieldType: prop.fieldType,
  };
  if (groupName) {
    payload.groupName = groupName;
  }
  if (prop.description) {
    payload.description = prop.description;
  }
  if (prop.required) {
    payload.hasUniqueValue = false;
  }
  return payload;
}

const SCHEMA_POST_PATHS = ["/crm/v3/schemas", "/crm-object-schemas/v3/schemas"];

/** Fields commonly returned by HubSpot after POST schema create (subset; extras ignored). */
export type HubSpotSchemaCreateResult = {
  objectTypeId?: string;
  name?: string;
  fullyQualifiedName?: string;
  labels?: { singular?: string; plural?: string };
};

export async function hubspotCreateCustomObjectSchema(
  body: HubSpotSchemaCreateBody,
): Promise<HubSpotJsonResult<HubSpotSchemaCreateResult>> {
  for (const path of SCHEMA_POST_PATHS) {
    const res = await hubspotApiSendJson<HubSpotSchemaCreateResult>(path, {
      method: "POST",
      body,
    });
    if (res.ok) {
      return res;
    }
    if (res.status !== 404) {
      return res;
    }
  }
  return { ok: false, status: 404, message: "Schema create failed on all known endpoints." };
}

type PropertyGroupsList = { results?: Array<{ name?: string; label?: string }> };

export async function hubspotListPropertyGroups(
  objectTypeId: string,
): Promise<HubSpotJsonResult<PropertyGroupsList>> {
  const encoded = encodeURIComponent(objectTypeId);
  return hubspotApiGetJson<PropertyGroupsList>(`/crm/v3/properties/${encoded}/groups`);
}

export async function hubspotCreatePropertyGroup(
  objectTypeId: string,
  body: { name: string; label: string; displayOrder?: number },
): Promise<HubSpotJsonResult<unknown>> {
  const encoded = encodeURIComponent(objectTypeId);
  return hubspotApiSendJson(`/crm/v3/properties/${encoded}/groups`, {
    method: "POST",
    body: { displayOrder: body.displayOrder ?? 0, name: body.name, label: body.label },
  });
}

export async function hubspotCreateProperty(
  objectTypeId: string,
  payload: Record<string, unknown>,
): Promise<HubSpotJsonResult<unknown>> {
  const encoded = encodeURIComponent(objectTypeId);
  return hubspotApiSendJson(`/crm/v3/properties/${encoded}`, {
    method: "POST",
    body: payload,
  });
}

export async function hubspotPatchProperty(
  objectTypeId: string,
  propertyName: string,
  payload: Record<string, unknown>,
): Promise<HubSpotJsonResult<unknown>> {
  const o = encodeURIComponent(objectTypeId);
  const p = encodeURIComponent(propertyName);
  return hubspotApiSendJson(`/crm/v3/properties/${o}/${p}`, {
    method: "PATCH",
    body: payload,
  });
}

export type HubSpotCreateSchemaAssociationBody = {
  fromObjectTypeId: string;
  toObjectTypeId: string;
  name: string;
};

const ASSOCIATION_POST_PATH_PREFIXES = [
  "/crm-object-schemas/v3/schemas",
  "/crm/v3/schemas",
];

export async function hubspotCreateSchemaAssociation(
  /** Custom object fully-qualified id (e.g. 2-123) whose schema receives the association definition */
  schemaObjectTypeId: string,
  body: HubSpotCreateSchemaAssociationBody,
): Promise<HubSpotJsonResult<{ id?: string; typeId?: string }>> {
  const encoded = encodeURIComponent(schemaObjectTypeId);
  for (const prefix of ASSOCIATION_POST_PATH_PREFIXES) {
    const path = `${prefix}/${encoded}/associations`;
    const res = await hubspotApiSendJson<{ id?: string; typeId?: string }>(path, {
      method: "POST",
      body,
    });
    if (res.ok) {
      return res;
    }
    if (res.status !== 404) {
      return res;
    }
  }
  return { ok: false, status: 404, message: "Association create failed on all known endpoints." };
}

export function isHubSpotDuplicateError(status: number, message: string): boolean {
  if (status === 409) {
    return true;
  }
  const m = message.toLowerCase();
  return (
    m.includes("already exists") ||
    m.includes("duplicate") ||
    m.includes("conflict")
  );
}
