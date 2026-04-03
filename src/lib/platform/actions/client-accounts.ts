"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/src/lib/auth/guards";
import {
  createClientAccountRecord,
  getClientAccountBySlug,
} from "@/src/lib/platform/client-accounts-repo";
import { registerNewClientAppInstalls } from "@/src/lib/platform/mock-data";
import { logActivity } from "@/src/lib/workspace/activity-log";

export type CreateClientAccountState = { ok: boolean; message: string };

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createClientAccountAction(
  _prev: CreateClientAccountState | undefined,
  formData: FormData,
): Promise<CreateClientAccountState> {
  const session = await requirePlatformAdmin();

  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const hubspotPortalId = String(formData.get("hubspotPortalId") ?? "").trim();

  if (!name) {
    return { ok: false, message: "Name is required." };
  }
  if (!hubspotPortalId) {
    return { ok: false, message: "HubSpot portal ID is required." };
  }
  if (!/^\d+$/.test(hubspotPortalId)) {
    return { ok: false, message: "HubSpot portal ID should be numeric." };
  }

  if (!slug) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }
  if (!slug) {
    return { ok: false, message: "Could not derive a URL slug — enter one manually." };
  }

  const existing = await getClientAccountBySlug(slug);
  if (existing) {
    return { ok: false, message: "That slug is already in use. Pick another." };
  }

  try {
    const client = await createClientAccountRecord({
      name,
      slug,
      hubspotPortalId,
      connectionStatus: "ready_to_connect",
    });
    registerNewClientAppInstalls(client.id);
    await logActivity({
      clientAccountId: client.id,
      userId: session.user.id,
      action: "client.created",
      entityType: "client_account",
      entityId: client.id,
      details: { name, slug, hubspotPortalId },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg.includes("Unique constraint") ? "Slug already exists." : msg };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/dashboard");

  return { ok: true, message: "Client account created." };
}
