import { z } from "zod";

import { prisma } from "@/src/lib/prisma";

const normalizedContextSchema = z.object({
  version: z.number(),
  portalId: z.string(),
  pipelines: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        objectType: z.string().optional(),
        stages: z.array(z.object({ id: z.string(), label: z.string() })),
      }),
    )
    .default([]),
  dealProperties: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        type: z.string().optional(),
        hubspotDefined: z.boolean().optional(),
      }),
    )
    .default([]),
  workflowSummary: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        objectType: z.string().optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .default([]),
  notes: z.array(z.string()).optional(),
});

export type NormalizedPortalContext = z.infer<typeof normalizedContextSchema>;

export async function ingestPortalContextMock(params: {
  clientAccountId: string;
  hubspotPortalId: string;
}): Promise<NormalizedPortalContext> {
  const mock: NormalizedPortalContext = {
    version: 1,
    portalId: params.hubspotPortalId,
    pipelines: [
      {
        id: "renewals-pipeline-mock",
        label: "Renewals",
        objectType: "DEAL",
        stages: [
          { id: "s1", label: "Renewal Due" },
          { id: "s2", label: "In negotiation" },
          { id: "s3", label: "Closed won renewal" },
        ],
      },
      {
        id: "default",
        label: "Sales Pipeline",
        objectType: "DEAL",
        stages: [
          { id: "appointmentscheduled", label: "Appointment Scheduled" },
          { id: "closedwon", label: "Closed Won" },
        ],
      },
    ],
    dealProperties: [
      { name: "dealname", label: "Deal Name", hubspotDefined: true },
      { name: "closedate", label: "Close Date", hubspotDefined: true },
      { name: "contract_end_date", label: "Contract End Date" },
    ],
    workflowSummary: [
      {
        name: "Renewals | Calculate dates from contract end",
        objectType: "DEAL",
        enabled: false,
      },
    ],
    notes: ["Mock snapshot — replace with live CRM schema + pipelines API."],
  };

  const payload = normalizedContextSchema.parse(mock);

  await prisma.hubspotAiPortalSnapshot.create({
    data: {
      clientAccountId: params.clientAccountId,
      hubspotPortalId: params.hubspotPortalId,
      summary: `Mock ingest for portal ${params.hubspotPortalId}`,
      payload: JSON.stringify(payload),
      source: "mock-ingestion",
    },
  });

  return payload;
}
