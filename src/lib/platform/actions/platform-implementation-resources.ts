"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/src/lib/auth/guards";
import { getClientAccountBySlug } from "@/src/lib/platform/client-accounts-repo";
import {
  createImplementationResourceForClient,
  deleteImplementationResourceForClient,
  listImplementationResourcesForClient,
} from "@/src/lib/workspace/implementation-resources-repo";

const IMPL_BASE = "/admin/apps/hubspot-ai-implementation";

function revalidateClientImplementationPaths(clientSlug: string) {
  revalidatePath(`${IMPL_BASE}/${clientSlug}/resources`, "page");
  revalidatePath(`${IMPL_BASE}/${clientSlug}/builder`, "page");
  revalidatePath(IMPL_BASE, "layout");
}

async function requireClientSlug(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) {
    throw new Error("Client is required.");
  }
  const client = await getClientAccountBySlug(trimmed);
  if (!client) {
    throw new Error("Unknown client account.");
  }
  return client;
}

export async function listImplementationResourcesForClientAction(clientSlug: string) {
  await requirePlatformAdmin();
  const client = await requireClientSlug(clientSlug);
  return listImplementationResourcesForClient(client.id);
}

export async function addClientImplementationResourceFormAction(formData: FormData) {
  await addClientImplementationResourceAction(undefined, formData);
}

export async function addClientImplementationResourceAction(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  await requirePlatformAdmin();
  const clientSlug = String(formData.get("clientSlug") ?? "").trim();
  const type = String(formData.get("type") ?? "notes").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  const client = await requireClientSlug(clientSlug).catch(() => null);
  if (!client) {
    return { ok: false, message: "Invalid client account." };
  }

  await createImplementationResourceForClient({
    clientAccountId: client.id,
    type,
    title,
    url: url || null,
    content: content || null,
  });
  revalidateClientImplementationPaths(client.slug);
  return { ok: true, message: "Resource added." };
}

export async function deleteClientImplementationResourceFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const clientSlug = String(formData.get("clientSlug") ?? "").trim();
  if (!id || !clientSlug) {
    return;
  }
  await deleteClientImplementationResourceAction(id, clientSlug);
}

export async function deleteClientImplementationResourceAction(id: string, clientSlug: string) {
  await requirePlatformAdmin();
  const client = await requireClientSlug(clientSlug);
  await deleteImplementationResourceForClient(id, client.id);
  revalidateClientImplementationPaths(client.slug);
}
