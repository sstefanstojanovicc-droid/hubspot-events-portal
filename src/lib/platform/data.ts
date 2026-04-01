import { getObjectModule } from "@/src/config/portal-registry";
import { hubspotClient } from "@/src/lib/hubspot/client";
import type { HubSpotFilter, HubSpotRecord } from "@/src/types/hubspot";
import type {
  ObjectModuleConfig,
  PlatformFilterState,
  RecordListItem,
} from "@/src/types/platform";

export function buildHubSpotFilters(
  module: ObjectModuleConfig,
  state: PlatformFilterState,
): HubSpotFilter[] {
  const filters: HubSpotFilter[] = [];

  for (const field of module.filterFields) {
    const value = state.values[field.key];
    if (!value) continue;

    filters.push({
      property: field.key,
      operator: "EQ",
      value,
    });
  }

  return filters;
}

export async function loadObjectRecords(
  objectType: string,
  state: PlatformFilterState,
): Promise<{
  module: ObjectModuleConfig;
  records: HubSpotRecord[];
  listItems: RecordListItem[];
  detailProperties: string[];
}> {
  const resolved = getObjectModule(objectType);

  if (!resolved) {
    throw new Error(`Unknown object type: ${objectType}`);
  }

  const { module } = resolved;
  const listPropertyKeys = ["name", ...module.listFields.map((field) => field.key)];
  const detailPropertyKeys = ["name", ...module.detailFields.map((field) => field.key)];
  const propertyKeys = Array.from(new Set([...listPropertyKeys, ...detailPropertyKeys]));

  const response = await hubspotClient.listRecords({
    objectType,
    properties: propertyKeys,
    associations: module.linkedObjectTypes,
    filters: buildHubSpotFilters(module, state),
    search: state.search,
    limit: 50,
  });

  const listItems = toRecordListItems(response.records, module);

  return {
    module,
    records: response.records,
    listItems,
    detailProperties: detailPropertyKeys,
  };
}

export function toRecordListItems(
  records: HubSpotRecord[],
  module: ObjectModuleConfig,
): RecordListItem[] {
  return records.map((record) => ({
    id: record.id,
    objectType: record.objectType,
    title: String(record.properties.name ?? `Record ${record.id}`),
    subtitle:
      module.subtitle ??
      `${module.title} profile from HubSpot ${record.objectType} object`,
    fields: module.listFields.map((field) => ({
      label: field.label,
      value: String(record.properties[field.key] ?? "-"),
      variant: field.variant,
    })),
  }));
}
