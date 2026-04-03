import "server-only";

import { prisma } from "@/src/lib/prisma";

export async function listUsersForTenant(clientAccountId: string) {
  return prisma.user.findMany({
    where: { clientAccountId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
    orderBy: { email: "asc" },
  });
}
