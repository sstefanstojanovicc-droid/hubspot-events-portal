"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/prisma";

const SIDEBAR_LOGO_KEY = "sidebar_logo";
const MAX_DATA_URL_LENGTH = 450_000; // ~330KB image as base64

function isAllowedDataUrl(dataUrl: string): boolean {
  if (!dataUrl.startsWith("data:image/")) return false;
  if (dataUrl.startsWith("data:image/svg+xml")) {
    return true;
  }
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(dataUrl);
}

export type BrandingActionState = { ok: boolean; message: string };

export async function saveSidebarLogoAction(
  _prev: BrandingActionState | undefined,
  formData: FormData,
): Promise<BrandingActionState> {
  await requireAdmin();
  const dataUrl = String(formData.get("dataUrl") ?? "").trim();
  if (!dataUrl) {
    return { ok: false, message: "No image provided." };
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    return {
      ok: false,
      message: "File too large. Use a smaller image (under ~300KB).",
    };
  }
  if (!isAllowedDataUrl(dataUrl)) {
    return {
      ok: false,
      message: "Use PNG, JPG, WebP, GIF, or SVG.",
    };
  }

  await prisma.appSetting.upsert({
    where: { key: SIDEBAR_LOGO_KEY },
    create: { key: SIDEBAR_LOGO_KEY, value: dataUrl },
    update: { value: dataUrl },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Logo saved." };
}

export async function clearSidebarLogoAction(): Promise<BrandingActionState> {
  await requireAdmin();
  await prisma.appSetting.deleteMany({ where: { key: SIDEBAR_LOGO_KEY } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Logo removed." };
}
