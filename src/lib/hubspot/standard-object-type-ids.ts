/**
 * HubSpot CRM standard object type ids (for association matching in provisioning).
 * @see HubSpot CRM — object type id reference
 */
export const HUBSPOT_STANDARD_OBJECT_TYPE_IDS: Record<string, string> = {
  contacts: "0-1",
  companies: "0-2",
  deals: "0-3",
  tickets: "0-5",
};

export function getStandardObjectTypeId(objectType: string): string | undefined {
  return HUBSPOT_STANDARD_OBJECT_TYPE_IDS[objectType];
}
