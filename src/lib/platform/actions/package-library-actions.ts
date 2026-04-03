"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/src/lib/auth/guards";
import {
  deletePackageDefinition,
  getPackageDefinitionById,
  updatePackageDefinitionMeta,
  updatePackageVersionFields,
} from "@/src/lib/workspace/packages-repo";

const LIBRARY = "/admin/package-library";

export async function updatePackageMetaFormAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("packageId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const portal = String(formData.get("sourceHubspotPortalId") ?? "").trim();

  if (!id || !name) {
    redirect(LIBRARY);
  }

  await updatePackageDefinitionMeta({
    id,
    name,
    description,
    sourceHubspotPortalId: portal || null,
  });
  revalidatePath(LIBRARY);
  revalidatePath(`${LIBRARY}/${id}`);
  revalidatePath(`${LIBRARY}/${id}/edit`);
  redirect(`${LIBRARY}/${id}`);
}

export async function updatePackageVersionFormAction(formData: FormData) {
  await requirePlatformAdmin();
  const packageId = String(formData.get("packageId") ?? "").trim();
  const versionId = String(formData.get("versionId") ?? "").trim();
  const versionLabel = String(formData.get("versionLabel") ?? "").trim();
  const notes = String(formData.get("notes") ?? "");

  if (!packageId || !versionId || !versionLabel) {
    redirect(packageId ? `${LIBRARY}/${packageId}/edit` : LIBRARY);
  }

  await updatePackageVersionFields({ versionId, versionLabel, notes });
  revalidatePath(LIBRARY);
  revalidatePath(`${LIBRARY}/${packageId}`);
  revalidatePath(`${LIBRARY}/${packageId}/edit`);
  redirect(`${LIBRARY}/${packageId}`);
}

export async function deletePackageFormAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("packageId") ?? "").trim();
  if (!id) {
    return;
  }
  const row = await getPackageDefinitionById(id);
  if (!row) {
    return;
  }
  await deletePackageDefinition(id);
  revalidatePath(LIBRARY);
  redirect(LIBRARY);
}
