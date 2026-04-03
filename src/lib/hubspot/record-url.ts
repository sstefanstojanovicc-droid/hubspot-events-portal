/**
 * Deep link to a CRM record in the HubSpot UI (contacts home / record view).
 * @see https://knowledge.hubspot.com/contacts/where-do-i-find-my-hub-id
 */
export function buildHubSpotCrmRecordUrl(
  portalId: string,
  objectTypeId: string,
  recordId: string,
): string {
  const p = portalId.trim();
  const o = objectTypeId.trim();
  const r = recordId.trim();
  if (!p || !o || !r) {
    return "";
  }
  return `https://app.hubspot.com/contacts/${encodeURIComponent(p)}/record/${encodeURIComponent(o)}/${encodeURIComponent(r)}`;
}
