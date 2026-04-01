import "server-only";

import { getHubSpotAccessToken } from "@/src/lib/hubspot/env";

function hubspotApiLog(
  kind: "error",
  payload: Record<string, unknown>,
): void {
  console.error(`[hubspot-api] ${JSON.stringify({ kind, ...payload })}`);
}

export type HubSpotJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

export async function hubspotApiGetJson<T>(
  path: string,
  init?: RequestInit,
): Promise<HubSpotJsonResult<T>> {
  const token = getHubSpotAccessToken();
  if (!token) {
    return { ok: false, status: 0, message: "HUBSPOT_ACCESS_TOKEN is not set." };
  }

  const url = `https://api.hubapi.com${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    hubspotApiLog("error", {
      method: "GET",
      path,
      status: response.status,
      responseBody: body.trim().slice(0, 4000),
    });
    return {
      ok: false,
      status: response.status,
      message: body.trim().slice(0, 500) || `Request failed (${response.status})`,
    };
  }

  const data = (await response.json()) as T;
  return { ok: true, data };
}

export async function hubspotApiSendJson<T>(
  path: string,
  options: { method: "POST" | "PATCH" | "PUT"; body?: unknown },
  init?: RequestInit,
): Promise<HubSpotJsonResult<T>> {
  const token = getHubSpotAccessToken();
  if (!token) {
    return { ok: false, status: 0, message: "HUBSPOT_ACCESS_TOKEN is not set." };
  }

  const url = `https://api.hubapi.com${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    method: options.method,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const body = await response.text();
    const payloadJson =
      options.body === undefined
        ? undefined
        : typeof options.body === "string"
          ? options.body.slice(0, 4000)
          : JSON.stringify(options.body).slice(0, 4000);
    hubspotApiLog("error", {
      method: options.method,
      path,
      status: response.status,
      requestBody: payloadJson,
      responseBody: body.trim().slice(0, 4000),
    });
    return {
      ok: false,
      status: response.status,
      message: body.trim().slice(0, 800) || `Request failed (${response.status})`,
    };
  }

  const text = await response.text();
  if (!text) {
    return { ok: true, data: {} as T };
  }

  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return { ok: true, data: {} as T };
  }
}

/** DELETE a CRM object or resource that returns 204 No Content. */
export async function hubspotApiDelete(path: string): Promise<HubSpotJsonResult<void>> {
  const token = getHubSpotAccessToken();
  if (!token) {
    return { ok: false, status: 0, message: "HUBSPOT_ACCESS_TOKEN is not set." };
  }

  const url = `https://api.hubapi.com${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: "DELETE",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204 || response.status === 200) {
    return { ok: true, data: undefined };
  }

  const body = await response.text();
  hubspotApiLog("error", {
    method: "DELETE",
    path,
    status: response.status,
    responseBody: body.trim().slice(0, 4000),
  });
  return {
    ok: false,
    status: response.status,
    message: body.trim().slice(0, 800) || `Request failed (${response.status})`,
  };
}
