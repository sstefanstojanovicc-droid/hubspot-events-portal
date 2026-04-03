import "server-only";

import { prisma } from "@/src/lib/prisma";

export type ManualPackageItem = {
  id: string;
  resourceType: string;
  displayLabel?: string;
  notes?: string;
};

export async function listManualPackageDrafts() {
  return prisma.manualPackageDraft.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getManualPackageDraft(id: string) {
  return prisma.manualPackageDraft.findUnique({ where: { id } });
}

export async function upsertManualPackageDraft(input: {
  id?: string;
  name: string;
  sourceHubspotPortalId: string;
  items: ManualPackageItem[];
}) {
  const itemsJson = JSON.stringify(input.items);
  if (input.id) {
    return prisma.manualPackageDraft.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
        sourceHubspotPortalId: input.sourceHubspotPortalId.trim(),
        itemsJson,
      },
    });
  }
  return prisma.manualPackageDraft.create({
    data: {
      name: input.name.trim() || "Untitled package",
      sourceHubspotPortalId: input.sourceHubspotPortalId.trim(),
      itemsJson,
    },
  });
}

export function parseManualPackageItems(json: string): ManualPackageItem[] {
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(Boolean) as ManualPackageItem[];
  } catch {
    return [];
  }
}
