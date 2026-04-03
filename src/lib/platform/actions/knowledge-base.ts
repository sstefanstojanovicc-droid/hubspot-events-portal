"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/src/lib/auth/guards";
import {
  createPlatformKnowledgeEntry,
  deletePlatformKnowledgeEntry,
  listPlatformKnowledgeEntries,
} from "@/src/lib/platform/knowledge-base-repo";

const REVALIDATE = "/admin/apps/hubspot-ai-implementation/knowledge-base";

export async function listKnowledgeBaseEntriesAction() {
  await requirePlatformAdmin();
  return listPlatformKnowledgeEntries();
}

export async function addKnowledgeBaseEntryFormAction(formData: FormData) {
  await addKnowledgeBaseEntryAction(undefined, formData);
}

export async function addKnowledgeBaseEntryAction(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  await requirePlatformAdmin();
  const kind = String(formData.get("kind") ?? "rule") as "hubspot_article" | "rule";
  const title = String(formData.get("title") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) {
    return { ok: false, message: "Title is required." };
  }
  if (kind !== "hubspot_article" && kind !== "rule") {
    return { ok: false, message: "Invalid entry kind." };
  }

  await createPlatformKnowledgeEntry({
    kind,
    title,
    sourceUrl: sourceUrl || null,
    body,
  });
  revalidatePath(REVALIDATE);
  revalidatePath("/admin/apps/hubspot-ai-implementation", "layout");
  return { ok: true, message: "Saved to Knowledge Base." };
}

export async function deleteKnowledgeBaseEntryAction(id: string) {
  await requirePlatformAdmin();
  await deletePlatformKnowledgeEntry(id);
  revalidatePath(REVALIDATE);
  revalidatePath("/admin/apps/hubspot-ai-implementation", "layout");
}

export async function deleteKnowledgeBaseEntryFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return;
  }
  await deleteKnowledgeBaseEntryAction(id);
}
