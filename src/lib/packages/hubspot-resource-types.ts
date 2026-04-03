/** HubSpot asset kinds selectable when building a manual package (mirrors common portal objects). */
export const HUBSPOT_MANUAL_PACKAGE_RESOURCE_TYPES = [
  "Campaign",
  "Custom Object",
  "Dashboard",
  "Deal Pipeline (Legacy)",
  "Deal Tag",
  "Email (Marketing)",
  "Email Template (Marketing)",
  "Email Template (Sales)",
  "Field Group",
  "Form",
  "List",
  "Marketing Email",
  "Sales Email",
  "Sequence",
  "Snippet",
  "Task Queue",
  "Ticket Pipeline",
  "Workflow",
  "Other",
] as const;

export type HubspotManualPackageResourceType =
  (typeof HUBSPOT_MANUAL_PACKAGE_RESOURCE_TYPES)[number];
