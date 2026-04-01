"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { DEV_CLIENT_COOKIE, DEV_VIEW_COOKIE } from "@/src/lib/platform/dev-view-constants";
import type { DevPlatformView } from "@/src/lib/platform/dev-view-cookies";
import { DEFAULT_DEV_CLIENT_ID } from "@/src/lib/platform/mock-data";

const cookieBase = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function setDevPlatformViewAction(mode: DevPlatformView) {
  const jar = await cookies();
  jar.set(DEV_VIEW_COOKIE, mode, cookieBase);
  if (mode === "client" && !jar.get(DEV_CLIENT_COOKIE)?.value) {
    jar.set(DEV_CLIENT_COOKIE, DEFAULT_DEV_CLIENT_ID, cookieBase);
  }
  revalidatePath("/", "layout");
}

export async function setDevImpersonateClientIdAction(clientId: string) {
  const jar = await cookies();
  jar.set(DEV_CLIENT_COOKIE, clientId, cookieBase);
  revalidatePath("/", "layout");
}
