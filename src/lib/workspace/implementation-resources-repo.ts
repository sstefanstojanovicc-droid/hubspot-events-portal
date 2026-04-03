import "server-only";

import { prisma } from "@/src/lib/prisma";

export async function listImplementationResourcesForClient(clientAccountId: string) {
  return prisma.implementationResource.findMany({
    where: { clientAccountId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createImplementationResourceForClient(input: {
  clientAccountId: string;
  type: string;
  title: string;
  url?: string | null;
  content?: string | null;
}) {
  return prisma.implementationResource.create({
    data: {
      clientAccountId: input.clientAccountId,
      type: input.type.trim(),
      title: input.title.trim(),
      url: input.url?.trim() || null,
      content: input.content?.trim() || null,
    },
  });
}

export async function deleteImplementationResourceForClient(id: string, clientAccountId: string) {
  const row = await prisma.implementationResource.findFirst({
    where: { id, clientAccountId },
  });
  if (!row) {
    throw new Error("Resource not found.");
  }
  return prisma.implementationResource.delete({ where: { id } });
}
