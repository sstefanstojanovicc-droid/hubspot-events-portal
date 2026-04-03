import "server-only";

import { prisma } from "@/src/lib/prisma";

const SIDEBAR_LOGO_KEY = "sidebar_logo";

export async function getSidebarLogoSrc(): Promise<string | null> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: SIDEBAR_LOGO_KEY } });
    const v = row?.value?.trim();
    if (v) return v;
  } catch {
    /* prisma unavailable during some builds */
  }
  const envUrl = process.env.NEXT_PUBLIC_ADMIN_LOGO_URL?.trim();
  return envUrl || null;
}

export const BRANDING_APP_NAME = "HubSpot Operations Platform";
