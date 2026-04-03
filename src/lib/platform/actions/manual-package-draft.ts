"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/src/lib/auth/guards";
import {
  createPackageDefinitionWithVersion,
  markNotesAsManualPackageBuilder,
} from "@/src/lib/workspace/packages-repo";
import {
  getManualPackageDraft,
  listManualPackageDrafts,
  upsertManualPackageDraft,
  type ManualPackageItem,
  parseManualPackageItems,
} from "@/src/lib/platform/manual-package-draft-repo";

const BUILDER_PATH = "/admin/packages/builder";
const LIBRARY_PATH = "/admin/package-library";

export async function listManualPackageDraftsAction() {
  await requirePlatformAdmin();
  return listManualPackageDrafts();
}

export async function getManualPackageDraftAction(id: string) {
  await requirePlatformAdmin();
  return getManualPackageDraft(id);
}

export async function saveManualPackageDraftAction(
  _prev: { ok: boolean; message: string; draftId?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string; draftId?: string }> {
  await requirePlatformAdmin();
  const id = String(formData.get("draftId") ?? "").trim() || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const portalId = String(formData.get("sourceHubspotPortalId") ?? "").trim();
  const itemsJson = String(formData.get("itemsJson") ?? "[]");

  if (!portalId) {
    return { ok: false, message: "Source HubSpot portal ID is required." };
  }

  let items: ManualPackageItem[] = [];
  try {
    const parsed = JSON.parse(itemsJson) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false, message: "Invalid items payload." };
    }
    items = parsed as ManualPackageItem[];
  } catch {
    return { ok: false, message: "Invalid items JSON." };
  }

  const draft = await upsertManualPackageDraft({
    id,
    name: name || "Untitled package",
    sourceHubspotPortalId: portalId,
    items,
  });

  revalidatePath(BUILDER_PATH);
  return { ok: true, message: "Draft saved.", draftId: draft.id };
}

function formatManualPackageDescription(
  portalId: string,
  items: ManualPackageItem[],
): string {
  const lines = items.map((i) => {
    const label = i.displayLabel || i.resourceType;
    return i.notes ? `- ${label}: ${i.notes}` : `- ${label}`;
  });
  return [
    `Manual package manifest (source portal **${portalId}**).`,
    "",
    ...lines,
  ].join("\n");
}

export async function publishManualPackageDraftAction(
  _prev: { ok: boolean; message: string; packageId?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string; packageId?: string }> {
  await requirePlatformAdmin();
  const draftId = String(formData.get("draftId") ?? "").trim();
  if (!draftId) {
    return { ok: false, message: "Save the draft first." };
  }

  const draft = await getManualPackageDraft(draftId);
  if (!draft) {
    return { ok: false, message: "Draft not found." };
  }

  const items = parseManualPackageItems(draft.itemsJson);
  if (!items.length) {
    return { ok: false, message: "Add at least one resource type to the manifest." };
  }

  const description = formatManualPackageDescription(draft.sourceHubspotPortalId, items);
  const notesBody = [
    `Draft: ${draft.name}`,
    `Portal: ${draft.sourceHubspotPortalId}`,
    "",
    "```json",
    JSON.stringify({ items }, null, 2),
    "```",
  ].join("\n");

  const created = await createPackageDefinitionWithVersion({
    name: draft.name,
    description,
    sourceHubspotPortalId: draft.sourceHubspotPortalId,
    versionLabel: "1.0",
    versionNotes: markNotesAsManualPackageBuilder(notesBody),
  });

  revalidatePath(BUILDER_PATH);
  revalidatePath(LIBRARY_PATH);
  return { ok: true, message: "Published to package library.", packageId: created.id };
}
