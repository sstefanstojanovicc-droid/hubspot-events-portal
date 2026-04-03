"use server";

import { revalidatePath } from "next/cache";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { executeWritePlan } from "@/src/lib/hubspot-ai/execution-runner";
import { validateWritePlanOperation } from "@/src/lib/hubspot-ai/validate-plan";
import { prisma } from "@/src/lib/prisma";

const renewalOperations = () => {
  const props: [string, string, string][] = [
    ["Contract Start Date", "contract_start_date", "date"],
    ["Contract End Date", "contract_end_date", "date"],
    ["Renewal Eligible", "renewal_eligible", "bool"],
    ["Renewal Trigger Date", "renewal_trigger_date", "date"],
    ["Renewal Deal Close Date", "renewal_deal_close_date", "date"],
    ["Renewal Deal Name", "renewal_deal_name", "string"],
    ["Renewal Created", "renewal_created", "bool"],
    ["Renewal Created Date", "renewal_created_date", "date"],
    ["Renewal Outcome", "renewal_outcome", "string"],
  ];
  const ops: {
    order: number;
    type: string;
    targetObject: string;
    actionSummary: string;
    payload: object;
    payloadSummary: string;
  }[] = [];
  let order = 1;
  for (const [label, name, hubspotType] of props) {
    ops.push({
      order: order++,
      type: "CREATE_PROPERTY",
      targetObject: "DEALS",
      actionSummary: `Create Property — Deals: ${label}`,
      payloadSummary: `deal property ${name}`,
      payload: {
        kind: "CREATE_PROPERTY",
        data: {
          objectType: "DEALS",
          name,
          label,
          type: hubspotType,
          description: `Renewal system — ${label}`,
          groupName: "dealinformation",
        },
      },
    });
  }
  ops.push({
    order: order++,
    type: "CREATE_WORKFLOW",
    targetObject: "DEALS",
    actionSummary:
      "Create Workflow — Renewals | Calculate dates from contract end",
    payloadSummary: "PLATFORM_FLOW, 5 actions, enabled: false (draft)",
    payload: {
      kind: "CREATE_WORKFLOW",
      data: {
        name: "Renewals | Calculate dates from contract end",
        type: "PLATFORM_FLOW",
        objectTypeId: "0-3",
        enabled: false,
        actionsSummary:
          "Compute renewal_trigger_date from contract_end_date; optional custom code for business days.",
      },
    },
  });
  ops.push({
    order: order++,
    type: "CREATE_WORKFLOW",
    targetObject: "DEALS",
    actionSummary:
      "Create Workflow — Renewals | Create renewal deal and task",
    payloadSummary:
      "Enroll 60d before contract_end_date; renewal_created guard; create deal + task",
    payload: {
      kind: "CREATE_WORKFLOW",
      data: {
        name: "Renewals | Create renewal deal and task",
        type: "PLATFORM_FLOW",
        objectTypeId: "0-3",
        enabled: false,
        actionsSummary:
          "Create renewal deal in Renewals pipeline, copy associations, task for rep, set renewal_created.",
      },
    },
  });
  return ops;
};

export async function generateRenewalWritePlan(slug: string, threadId: string) {
  const client = await requireClientWorkspaceBySlug(slug);
  const thread = await prisma.hubspotAiChatThread.findUnique({
    where: { id: threadId },
  });
  if (!thread || thread.clientAccountId !== client.id) {
    throw new Error("Thread not found");
  }

  const rows = renewalOperations();
  for (const row of rows) {
    const v = validateWritePlanOperation({
      type: row.type,
      payload: row.payload,
    });
    if (!v.valid) {
      throw new Error(v.errors.join("; "));
    }
  }

  const resourcesCount = await prisma.implementationResource.count({
    where: { clientAccountId: client.id },
  });

  const plan = await prisma.hubspotAiWritePlan.create({
    data: {
      clientAccountId: client.id,
      hubspotPortalId: client.hubspotPortalId,
      title: "Implement annual deal renewals system",
      description:
        `Create renewal deal properties and draft deal-based workflows for 60-day renewal creation + rep tasks. Reuse existing Renewals pipeline where present. Grounded with ${resourcesCount} project resource(s) from the sidebar.`,
      status: "DRAFT",
      operationCount: rows.length,
      operations: {
        create: rows.map((r) => ({
          order: r.order,
          type: r.type,
          targetObject: r.targetObject,
          actionSummary: r.actionSummary,
          payload: JSON.stringify(r.payload),
          payloadSummary: r.payloadSummary,
          validationStatus: "valid",
          validationResult: JSON.stringify({ ok: true }),
        })),
      },
    },
  });

  revalidatePath(`/clients/${slug}/hubspot-ai/thread/${threadId}`);
  revalidatePath(`/clients/${slug}/hubspot-ai/plans`);
  return plan.id;
}

export async function approveHubspotAiWritePlan(slug: string, writePlanId: string) {
  const client = await requireClientWorkspaceBySlug(slug);
  const plan = await prisma.hubspotAiWritePlan.findUnique({
    where: { id: writePlanId },
    include: { operations: { orderBy: { order: "asc" } } },
  });
  if (!plan || plan.clientAccountId !== client.id) {
    throw new Error("Not found");
  }
  if (plan.status !== "DRAFT") {
    throw new Error("Only draft plans can be approved");
  }

  await prisma.hubspotAiWritePlan.update({
    where: { id: writePlanId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedSnapshot: JSON.stringify({
        title: plan.title,
        description: plan.description,
        operations: plan.operations.map((o) => ({
          id: o.id,
          order: o.order,
          type: o.type,
          targetObject: o.targetObject,
          actionSummary: o.actionSummary,
          payload: o.payload,
        })),
      }),
    },
  });

  revalidatePath(`/clients/${slug}/hubspot-ai/plans`);
  revalidatePath(`/clients/${slug}/hubspot-ai`);
}

export async function runApprovedHubspotAiWritePlan(slug: string, writePlanId: string) {
  const client = await requireClientWorkspaceBySlug(slug);
  const plan = await prisma.hubspotAiWritePlan.findUnique({
    where: { id: writePlanId },
  });
  if (!plan || plan.clientAccountId !== client.id) {
    throw new Error("Not found");
  }

  return executeWritePlan(writePlanId);
}
