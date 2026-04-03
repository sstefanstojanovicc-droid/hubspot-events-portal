import { z } from "zod";

export const WriteOperationTypeSchema = z.enum([
  "CREATE_PROPERTY",
  "UPDATE_PROPERTY",
  "CREATE_WORKFLOW",
  "UPDATE_WORKFLOW",
  "CREATE_TASK_TEMPLATE",
  "CREATE_ASSOCIATION_LABEL",
  "CREATE_CUSTOM_CODE_ACTION_METADATA",
  "REUSE_EXISTING_ASSET",
  "CREATE_DEAL_PIPELINE_STAGE",
  "UPDATE_DEAL_PIPELINE",
]);

export const createPropertyPayloadSchema = z.object({
  objectType: z.enum(["DEALS", "CONTACTS", "COMPANIES", "TICKETS"]),
  name: z.string(),
  label: z.string(),
  type: z.string(),
  fieldType: z.string().optional(),
  description: z.string().optional(),
  groupName: z.string().optional(),
});

export const createWorkflowPayloadSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  objectTypeId: z.string().optional(),
  enabled: z.boolean().optional(),
  actionsSummary: z.string().optional(),
});

export const writePlanOperationPayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("CREATE_PROPERTY"),
    data: createPropertyPayloadSchema,
  }),
  z.object({
    kind: z.literal("CREATE_WORKFLOW"),
    data: createWorkflowPayloadSchema,
  }),
  z.object({
    kind: z.literal("REUSE_EXISTING_ASSET"),
    data: z.object({
      assetType: z.string(),
      hubspotId: z.string(),
      reason: z.string(),
    }),
  }),
  z.object({
    kind: z.literal("CREATE_CUSTOM_CODE_ACTION_METADATA"),
    data: z.object({
      workflowName: z.string(),
      description: z.string(),
      languageHint: z.string().optional(),
    }),
  }),
]);
