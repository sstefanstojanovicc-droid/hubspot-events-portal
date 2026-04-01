import "server-only";

import { getHubSpotAccessToken } from "@/src/lib/hubspot/env";

export type HubSpotTokenIntrospectionResult =
  | { ok: true; portalId: string; hubDomain?: string }
  | { ok: false; message: string; httpStatus?: number };

/**
 * Resolves the HubSpot portal id for the current access token (server-only).
 * Uses GET /account-info/v3/details with Authorization: Bearer — works for private app
 * tokens and OAuth access tokens. (GET /oauth/v1/access-tokens/{token} rejects PATs with
 * "The access token must have the correct format".)
 */
export async function introspectHubSpotAccessToken(): Promise<HubSpotTokenIntrospectionResult> {
  const token = getHubSpotAccessToken();
  if (!token) {
    return { ok: false, message: "HUBSPOT_ACCESS_TOKEN is not set." };
  }

  const response = await fetch("https://api.hubapi.com/account-info/v3/details", {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      httpStatus: response.status,
      message: body.trim().slice(0, 400) || `Token introspection failed (${response.status})`,
    };
  }

  const data = (await response.json()) as { portalId?: number; uiDomain?: string };
  const portalId = data.portalId;
  if (portalId == null) {
    return { ok: false, message: "Account info response did not include portalId." };
  }

  return {
    ok: true,
    portalId: String(portalId),
    hubDomain: data.uiDomain,
  };
}
