import { z } from "zod";
import {
  WriteOperationTypeSchema,
  writePlanOperationPayloadSchema,
} from "@/src/lib/hubspot-ai/write-plan-types";

const operationRowSchema = z.object({
  type: WriteOperationTypeSchema,
  payload: z.unknown(),
});

export function validateWritePlanOperation(row: {
  type: string;
  payload: unknown;
}): { valid: boolean; errors: string[]; normalizedPayload?: unknown } {
  const base = operationRowSchema.safeParse(row);
  if (!base.success) {
    return {
      valid: false,
      errors: base.error.issues.map((i) => i.message),
    };
  }

  const t = base.data.type;
  if (
    t === "CREATE_PROPERTY" ||
    t === "CREATE_WORKFLOW" ||
    t === "REUSE_EXISTING_ASSET" ||
    t === "CREATE_CUSTOM_CODE_ACTION_METADATA"
  ) {
    const p = writePlanOperationPayloadSchema.safeParse(row.payload);
    if (!p.success) {
      return {
        valid: false,
        errors: p.error.issues.map((i) => i.message),
      };
    }
    return { valid: true, errors: [], normalizedPayload: p.data };
  }

  return { valid: true, errors: [], normalizedPayload: row.payload };
}
