import "server-only";

import { prisma } from "@/src/lib/prisma";

export async function listPlatformKnowledgeEntries() {
  return prisma.platformKnowledgeEntry.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function createPlatformKnowledgeEntry(input: {
  kind: "hubspot_article" | "rule";
  title: string;
  sourceUrl?: string | null;
  body?: string;
}) {
  return prisma.platformKnowledgeEntry.create({
    data: {
      kind: input.kind,
      title: input.title.trim(),
      sourceUrl: input.sourceUrl?.trim() || null,
      body: input.body?.trim() ?? "",
    },
  });
}

export async function deletePlatformKnowledgeEntry(id: string) {
  return prisma.platformKnowledgeEntry.delete({ where: { id } });
}
