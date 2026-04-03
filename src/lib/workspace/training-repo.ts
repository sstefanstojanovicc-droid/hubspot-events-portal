import "server-only";

import { prisma } from "@/src/lib/prisma";

export async function listTrainingModulesForClient(clientAccountId: string) {
  return prisma.trainingModule.findMany({
    where: {
      OR: [{ clientAccountId: null }, { clientAccountId }],
    },
    orderBy: { title: "asc" },
  });
}
