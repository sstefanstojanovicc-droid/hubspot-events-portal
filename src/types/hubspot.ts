export type HubSpotObjectType = string;

export type HubSpotPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date;

export type HubSpotRecordProperties = Record<string, HubSpotPropertyValue>;

export interface HubSpotAssociation {
  toObjectType: HubSpotObjectType;
  toRecordId: string;
  label?: string;
}

export interface HubSpotRecord {
  id: string;
  objectType: HubSpotObjectType;
  properties: HubSpotRecordProperties;
  associations?: HubSpotAssociation[];
}

export interface HubSpotListResponse {
  records: HubSpotRecord[];
  total: number;
  paging?: {
    next?: string;
    previous?: string;
  };
}

export interface HubSpotFilter {
  property: string;
  operator:
    | "EQ"
    | "NEQ"
    | "IN"
    | "NOT_IN"
    | "GT"
    | "GTE"
    | "LT"
    | "LTE"
    | "CONTAINS_TOKEN";
  value: string | number | boolean;
}

export interface HubSpotListQuery {
  objectType: HubSpotObjectType;
  properties: string[];
  associations?: HubSpotObjectType[];
  limit?: number;
  after?: string;
  filters?: HubSpotFilter[];
  search?: string;
}
