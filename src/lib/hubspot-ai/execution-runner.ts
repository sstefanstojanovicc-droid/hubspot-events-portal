import { prisma } from "@/src/lib/prisma";

import { HubSpotWriteClient } from "@/src/lib/hubspot-ai/hubspot-write-client";

export type WritePlanTerminalStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export async function executeWritePlan(writePlanId: string): Promise<{
  runId: string;
  finalStatus: WritePlanTerminalStatus;
}> {
  const plan = await prisma.hubspotAiWritePlan.findUnique({
    where: { id: writePlanId },
    include: {
      operations: { orderBy: { order: "asc" } },
    },
  });

  if (!plan) {
    throw new Error("Write plan not found");
  }
  if (plan.status !== "APPROVED") {
    throw new Error("Plan must be approved before execution");
  }

  await prisma.hubspotAiWritePlan.update({
    where: { id: writePlanId },
    data: { status: "RUNNING" },
  });

  const run = await prisma.hubspotAiExecutionRun.create({
    data: {
      writePlanId,
      status: "running",
    },
  });

  const writeClient = new HubSpotWriteClient(plan.hubspotPortalId);
  let successCount = 0;
  let failureCount = 0;

  for (const op of plan.operations) {
    try {
      await prisma.hubspotAiExecutionStepLog.create({
        data: {
          executionRunId: run.id,
          operationId: op.id,
          success: true,
          requestMeta: JSON.stringify({ simulated: true, type: op.type }),
          responseMeta: JSON.stringify({
            message:
              "Simulated execution — wire HubSpot mutations to perform real changes.",
          }),
          hubspotUrl: hubspotAssetUrl(plan.hubspotPortalId, op.type, op.targetObject),
        },
      });
      successCount++;
      void writeClient;
    } catch (e) {
      failureCount++;
      const msg = e instanceof Error ? e.message : "Unknown error";
      await prisma.hubspotAiExecutionStepLog.create({
        data: {
          executionRunId: run.id,
          operationId: op.id,
          success: false,
          errorMessage: msg,
          requestMeta: JSON.stringify({ type: op.type }),
        },
      });
      break;
    }
  }

  const finalStatus: WritePlanTerminalStatus =
    failureCount === 0 ? "SUCCESS" : successCount > 0 ? "PARTIAL" : "FAILED";

  await prisma.hubspotAiExecutionRun.update({
    where: { id: run.id },
    data: {
      status:
        finalStatus === "SUCCESS"
          ? "success"
          : finalStatus === "PARTIAL"
            ? "partial"
            : "failed",
      completedAt: new Date(),
      summary: `${successCount} succeeded, ${failureCount} failed (simulated).`,
    },
  });

  await prisma.hubspotAiWritePlan.update({
    where: { id: writePlanId },
    data: {
      status: finalStatus,
      recordsAffected: successCount,
    },
  });

  return { runId: run.id, finalStatus };
}

function hubspotAssetUrl(
  portalId: string,
  type: string,
  target?: string | null,
): string | null {
  const base = `https://app.hubspot.com/contacts/${portalId}`;
  if (type.includes("WORKFLOW")) {
    return `${base}/workflows`;
  }
  if (type.includes("PROPERTY") && target) {
    return `${base}/property-settings/deal`;
  }
  return base;
}
