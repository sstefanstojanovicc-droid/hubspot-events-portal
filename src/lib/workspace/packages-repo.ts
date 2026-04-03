import "server-only";

import { prisma } from "@/src/lib/prisma";

export async function listPackageDefinitions() {
  return prisma.packageDefinition.findMany({
    orderBy: { name: "asc" },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getPackageDefinitionById(id: string) {
  return prisma.packageDefinition.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
      clientAccount: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updatePackageDefinitionMeta(input: {
  id: string;
  name: string;
  description: string;
  sourceHubspotPortalId?: string | null;
}) {
  return prisma.packageDefinition.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      description: input.description.trim(),
      sourceHubspotPortalId: input.sourceHubspotPortalId?.trim() || null,
    },
  });
}

export async function updatePackageVersionFields(input: {
  versionId: string;
  versionLabel: string;
  notes: string;
}) {
  return prisma.packageVersion.update({
    where: { id: input.versionId },
    data: {
      versionLabel: input.versionLabel.trim(),
      notes: input.notes.trim(),
    },
  });
}

export async function deletePackageDefinition(id: string) {
  return prisma.packageDefinition.delete({ where: { id } });
}

export async function listInstallationsForClient(clientAccountId: string) {
  return prisma.packageInstallation.findMany({
    where: { clientAccountId },
    orderBy: { deployedAt: "desc" },
    include: {
      version: {
        include: { package: true },
      },
    },
  });
}

export async function installPackageVersionForClient(input: {
  packageVersionId: string;
  clientAccountId: string;
}) {
  return prisma.packageInstallation.create({
    data: {
      packageVersionId: input.packageVersionId,
      clientAccountId: input.clientAccountId,
      status: "installed",
    },
  });
}

const AI_IMPL_VERSION_MARKER = "[ai-implementation]";
const MANUAL_PACKAGE_MARKER = "[manual-package-builder]";

export async function listPackageDefinitionsWithAiImplementationVersions() {
  return prisma.packageDefinition.findMany({
    where: {
      versions: { some: { notes: { contains: AI_IMPL_VERSION_MARKER } } },
    },
    orderBy: { updatedAt: "desc" },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });
}

export async function listPackageDefinitionsWithAiImplementationVersionsForClient(clientAccountId: string) {
  return prisma.packageDefinition.findMany({
    where: {
      clientAccountId,
      versions: { some: { notes: { contains: AI_IMPL_VERSION_MARKER } } },
    },
    orderBy: { updatedAt: "desc" },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });
}

export async function createPackageDefinitionWithVersion(input: {
  name: string;
  description: string;
  sourceHubspotPortalId?: string | null;
  clientAccountId?: string | null;
  versionLabel: string;
  versionNotes: string;
}) {
  return prisma.packageDefinition.create({
    data: {
      name: input.name.trim(),
      description: input.description.trim(),
      sourceHubspotPortalId: input.sourceHubspotPortalId?.trim() || null,
      clientAccountId: input.clientAccountId?.trim() || null,
      versions: {
        create: [
          {
            versionLabel: input.versionLabel.trim(),
            notes: input.versionNotes.trim(),
          },
        ],
      },
    },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });
}

/** Package versions created from HubSpot AI Implementation (notes prefixed with marker). */
export async function listRecentAiImplementationVersions(take = 40) {
  return prisma.packageVersion.findMany({
    where: { notes: { contains: AI_IMPL_VERSION_MARKER } },
    orderBy: { createdAt: "desc" },
    take,
    include: { package: true },
  });
}

export async function listRecentAiImplementationVersionsForClient(clientAccountId: string, take = 40) {
  return prisma.packageVersion.findMany({
    where: {
      notes: { contains: AI_IMPL_VERSION_MARKER },
      package: { clientAccountId },
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { package: true },
  });
}

export function markNotesAsAiImplementation(body: string): string {
  return `${AI_IMPL_VERSION_MARKER}\n\n${body.trim()}`;
}

export function markNotesAsManualPackageBuilder(body: string): string {
  return `${MANUAL_PACKAGE_MARKER}\n\n${body.trim()}`;
}
