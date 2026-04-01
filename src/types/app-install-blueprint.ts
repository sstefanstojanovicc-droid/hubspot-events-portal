/**
 * App Install Blueprint — declarative schema a HubSpot-connected app needs.
 * Each app registers one blueprint; the provisioning service interprets it.
 */

export type HubSpotStandardObject = "contacts" | "companies" | "deals" | "tickets";

/** Reference to a custom object defined elsewhere in the same blueprint. */
export interface BlueprintCustomObjectRef {
  kind: "blueprint_custom";
  /** Stable key within the blueprint (e.g. candidate, shortlist). */
  objectKey: string;
}

export interface BlueprintHubSpotStandardRef {
  kind: "hubspot_standard";
  objectType: HubSpotStandardObject;
}

export type BlueprintObjectRef = BlueprintCustomObjectRef | BlueprintHubSpotStandardRef;

export interface BlueprintPropertyDefinition {
  /** HubSpot internal property name (snake_case). */
  name: string;
  /** Human-readable label in HubSpot. */
  label: string;
  /** HubSpot `type` (e.g. string, enumeration, date). */
  valueType: string;
  /** HubSpot `fieldType` (e.g. text, textarea, select). */
  fieldType: string;
  /** Optional JSON group name for property grouping in HubSpot. */
  groupName?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export interface BlueprintCustomObjectDefinition {
  objectKey: string;
  /** Unique schema `name` to create in HubSpot (snake_case). */
  schemaName: string;
  singularLabel: string;
  pluralLabel: string;
  description?: string;
  /** HubSpot primary display property — must exist in `requiredProperties`. */
  primaryDisplayProperty: string;
  /** Property group for organizing blueprint properties in HubSpot UI. */
  propertyGroup: { name: string; label: string };
  requiredProperties: BlueprintPropertyDefinition[];
}

/**
 * Logical association the app relies on.
 * Modelled as one direction; live HubSpot may store inverse metadata separately.
 */
export interface BlueprintAssociationDefinition {
  id: string;
  description?: string;
  from: BlueprintObjectRef;
  to: BlueprintObjectRef;
}

export interface BlueprintSetupTask {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
}

export interface BlueprintValidationCheck {
  id: string;
  description: string;
  /** Evaluated at provisioning time; keeps blueprint self-documenting. */
  severity: "blocking" | "warning";
}

/**
 * Keys the platform persists after provisioning (object type ids, property names, etc.).
 */
export interface BlueprintMappingKey {
  /** Stable platform key, e.g. objects.candidate.objectTypeId */
  key: string;
  description: string;
  /** What this key stores (for DB migration / UI). */
  valueKind: "hubspot_object_type_id" | "hubspot_property_name" | "hubspot_association_type_id" | "json";
  /** Where the value comes from in the blueprint. */
  source: BlueprintMappingSource;
}

export type BlueprintMappingSource =
  | { type: "blueprint_object"; objectKey: string }
  | { type: "blueprint_property"; objectKey: string; propertyName: string }
  | { type: "blueprint_association"; associationId: string };

export interface AppInstallBlueprint {
  id: string;
  appKey: string;
  displayName: string;
  description: string;
  version: string;
  customObjects: BlueprintCustomObjectDefinition[];
  associations: BlueprintAssociationDefinition[];
  setupTasks: BlueprintSetupTask[];
  validationChecks: BlueprintValidationCheck[];
  mappingKeys: BlueprintMappingKey[];
}
