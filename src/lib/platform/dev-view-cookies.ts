import "server-only";

import { cookies } from "next/headers";

import {
  DEV_CLIENT_COOKIE,
  DEV_VIEW_COOKIE,
} from "@/src/lib/platform/dev-view-constants";
import { DEFAULT_DEV_CLIENT_ID } from "@/src/lib/platform/mock-data";

export type DevPlatformView = "admin" | "client";

export { DEV_CLIENT_COOKIE, DEV_VIEW_COOKIE, DEFAULT_DEV_CLIENT_ID };

export async function getDevPlatformView(): Promise<DevPlatformView> {
  const jar = await cookies();
  const raw = jar.get(DEV_VIEW_COOKIE)?.value;
  return raw === "client" ? "client" : "admin";
}

export async function getDevImpersonateClientId(): Promise<string> {
  const jar = await cookies();
  return jar.get(DEV_CLIENT_COOKIE)?.value ?? DEFAULT_DEV_CLIENT_ID;
}
