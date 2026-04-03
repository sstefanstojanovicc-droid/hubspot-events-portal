import "server-only";

import { prisma } from "@/src/lib/prisma";

export type LogActivityInput = {
  clientAccountId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  const details =
    input.details && Object.keys(input.details).length > 0
      ? JSON.stringify(input.details)
      : "{}";
  await prisma.activityLog.create({
    data: {
      clientAccountId: input.clientAccountId,
      userId: input.userId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      details,
    },
  });
}

export async function listActivityLogsForClient(
  clientAccountId: string,
  limit = 100,
) {
  return prisma.activityLog.findMany({
    where: { clientAccountId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
