import "server-only";

import { prisma } from "@/src/lib/prisma";

export async function listFathomCallsForClient(clientAccountId: string, limit = 50) {
  return prisma.fathomCall.findMany({
    where: { clientAccountId },
    orderBy: { callAt: "desc" },
    take: limit,
    include: { linkedPlan: { select: { id: true, title: true } } },
  });
}

export async function getFathomCallById(id: string, clientAccountId: string) {
  return prisma.fathomCall.findFirst({
    where: { id, clientAccountId },
    include: { linkedPlan: true },
  });
}

export async function createFathomCall(input: {
  clientAccountId: string;
  title: string;
  callAt: Date;
  attendees?: string[];
  transcript?: string;
  summary?: string;
  source?: string;
}) {
  return prisma.fathomCall.create({
    data: {
      clientAccountId: input.clientAccountId,
      title: input.title.trim(),
      callAt: input.callAt,
      attendeesJson: JSON.stringify(input.attendees ?? []),
      transcript: input.transcript ?? "",
      summary: input.summary ?? "",
      source: input.source ?? "manual",
      extractionStatus: "pending",
    },
  });
}

export async function setFathomExtractionStatus(
  id: string,
  clientAccountId: string,
  status: "pending" | "processing" | "done" | "error",
  summary?: string,
) {
  return prisma.fathomCall.updateMany({
    where: { id, clientAccountId },
    data: {
      extractionStatus: status,
      ...(summary != null ? { summary } : {}),
    },
  });
}
