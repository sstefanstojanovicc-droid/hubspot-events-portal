import "server-only";

/**
 * Legacy filename — prefer implementing writes in `@/src/lib/hubspot/schema-api` and
 * orchestration in `@/src/lib/provisioning/search-board-live-install`.
 */

export {
  blueprintPropertyToHubSpotPayload,
  hubspotCreateCustomObjectSchema,
  hubspotCreateProperty,
  hubspotCreatePropertyGroup,
  hubspotCreateSchemaAssociation,
  hubspotListPropertyGroups,
  hubspotPatchProperty,
  isHubSpotDuplicateError,
  type HubSpotSchemaCreateResult,
} from "@/src/lib/hubspot/schema-api";
