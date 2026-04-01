import type { HubSpotFilter, HubSpotObjectType, HubSpotRecord } from "@/src/types/hubspot";

export interface DisplayFieldConfig {
  key: string;
  label: string;
  variant?: "text" | "badge" | "multiline";
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: "text" | "select";
  options?: Array<{ label: string; value: string }>;
}

export interface ObjectModuleConfig {
  id: string;
  objectType: HubSpotObjectType;
  title: string;
  subtitle?: string;
  listFields: DisplayFieldConfig[];
  detailFields: DisplayFieldConfig[];
  filterFields: FilterFieldConfig[];
  defaultSort?: {
    key: string;
    direction: "asc" | "desc";
  };
  linkedObjectTypes?: HubSpotObjectType[];
}

export interface PortalConfig {
  id: string;
  name: string;
  description: string;
  modules: ObjectModuleConfig[];
}

export interface RecordListItem {
  id: string;
  objectType: string;
  title: string;
  subtitle?: string;
  fields: Array<{
    label: string;
    value: string;
    variant?: "text" | "badge" | "multiline";
  }>;
}

export interface PlatformFilterState {
  search?: string;
  values: Record<string, string>;
}

export interface PlatformObjectData {
  module: ObjectModuleConfig;
  records: HubSpotRecord[];
  activeFilters: PlatformFilterState;
  derivedHubSpotFilters: HubSpotFilter[];
}
