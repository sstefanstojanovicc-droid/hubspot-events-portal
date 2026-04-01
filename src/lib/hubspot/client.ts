import "server-only";

import type {
  HubSpotListQuery,
  HubSpotListResponse,
  HubSpotRecord,
} from "@/src/types/hubspot";

import { getHubSpotAccessToken } from "@/src/lib/hubspot/env";

interface HubSpotClientOptions {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
}

export class HubSpotClient {
  private readonly baseUrl: string;
  private readonly explicitAccessToken?: string;

  constructor(options: HubSpotClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.hubapi.com";
    this.explicitAccessToken = options.accessToken;
  }

  private resolveAccessToken(): string | undefined {
    return this.explicitAccessToken ?? getHubSpotAccessToken();
  }

  async listRecords(query: HubSpotListQuery): Promise<HubSpotListResponse> {
    const mock = this.getMockData(query.objectType);

    return {
      records: mock,
      total: mock.length,
      paging: undefined,
    };
  }

  async getRecord(
    objectType: string,
    recordId: string,
    properties: string[],
  ): Promise<HubSpotRecord | null> {
    const records = this.getMockData(objectType);
    const match = records.find((record) => record.id === recordId);

    if (!match) {
      return null;
    }

    return {
      ...match,
      properties: Object.fromEntries(
        properties.map((key) => [key, match.properties[key]]),
      ),
    };
  }

  private getMockData(objectType: string): HubSpotRecord[] {
    if (objectType === "2-39167811") {
      return [
        {
          id: "101",
          objectType,
          properties: {
            name: "John Patterson",
            current_title: "Chief Financial Officer",
            summary:
              "Scaled SaaS finance organizations through two successful exits.",
            location: "Sydney",
            gender: "male",
          },
          associations: [{ toObjectType: "companies", toRecordId: "3001" }],
        },
        {
          id: "102",
          objectType,
          properties: {
            name: "Ava Chen",
            current_title: "VP Product",
            summary:
              "Led product strategy for enterprise marketplace and AI workflows.",
            location: "Melbourne",
            gender: "female",
          },
          associations: [{ toObjectType: "companies", toRecordId: "3002" }],
        },
      ];
    }

    return [];
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.resolveAccessToken();
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  getStatus() {
    const token = this.resolveAccessToken();
    return {
      baseUrl: this.baseUrl,
      hasToken: Boolean(token),
      authHeadersPresent: Boolean(token),
    };
  }
}

export const hubspotClient = new HubSpotClient();
