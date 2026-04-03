import { z } from "zod";

export const IMPLEMENTATION_AGENTS = [
  { id: "full_build" as const, label: "Full implementation", blurb: "Objects, automation, rollout" },
  { id: "data_model" as const, label: "Data model", blurb: "CRM schema & associations" },
  { id: "automation" as const, label: "Automation", blurb: "Workflows & ops" },
  { id: "governance" as const, label: "Governance", blurb: "Teams, data quality, guardrails" },
];

export type ImplementationAgentId = (typeof IMPLEMENTATION_AGENTS)[number]["id"];

const PropertySchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  type: z.string().optional(),
  purpose: z.string().optional(),
});

const CrmObjectSchema = z.object({
  apiName: z.string(),
  label: z.string().optional(),
  purpose: z.string().optional(),
  properties: z.array(PropertySchema).optional(),
});

const AssociationSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  cardinality: z.string().optional(),
});

const WorkflowStepSchema = z.object({
  order: z.number().optional(),
  name: z.string(),
  detail: z.string().optional(),
});

const WorkflowSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  trigger: z.string().optional(),
  steps: z.array(WorkflowStepSchema).optional(),
});

export const ImplementationPlanSchema = z.object({
  title: z.string().optional(),
  executiveSummary: z.string(),
  objects: z.array(CrmObjectSchema).default([]),
  associations: z.array(AssociationSchema).default([]),
  workflows: z.array(WorkflowSchema).default([]),
  flowchartMermaid: z.string().optional(),
  implementationChecklist: z.array(z.string()).optional(),
});

export type ImplementationPlan = z.infer<typeof ImplementationPlanSchema>;

export function normalizeImplementationPlan(raw: unknown): ImplementationPlan {
  const parsed = ImplementationPlanSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }
  return {
    executiveSummary:
      typeof raw === "object" && raw !== null && "executiveSummary" in raw
        ? String((raw as { executiveSummary: unknown }).executiveSummary)
        : "Could not parse structured plan. See raw output below.",
    objects: [],
    associations: [],
    workflows: [],
  };
}

/** Strip internal prefixes saved on package version notes. */
export function stripPackageNoteMarkers(raw: string): string {
  return raw
    .replace(/^\s*\[ai-implementation\]\s*\n+/i, "")
    .replace(/^\s*\[manual-package-builder\]\s*\n+/i, "")
    .trim();
}

/** Parse notes produced by {@link serializePlanForPackage} for display without raw JSON. */
export function parseSerializedPackageNotes(raw: string): {
  executiveSummary: string;
  plan: ImplementationPlan | null;
  /** True when JSON artifact was found and parsed. */
  hasStructuredPlan: boolean;
} {
  const trimmed = stripPackageNoteMarkers(raw).trim();
  let plan: ImplementationPlan | null = null;
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      plan = normalizeImplementationPlan(JSON.parse(fence[1].trim()));
    } catch {
      plan = null;
    }
  }

  let executiveSummary = "";
  const exMatch = trimmed.match(
    /###\s*Executive\s*summary\s*\n+([\s\S]*?)(?=\n###\s*Structured|\n###\s*[^\n]+|\n```|$)/i,
  );
  if (exMatch?.[1]?.trim()) {
    executiveSummary = exMatch[1].trim();
  } else if (plan?.executiveSummary) {
    executiveSummary = plan.executiveSummary;
  } else if (fence) {
    executiveSummary = trimmed
      .replace(fence[0], "")
      .replace(/^#[^\n]*\n*/gm, "")
      .trim()
      .slice(0, 8000);
  } else {
    executiveSummary = trimmed.slice(0, 8000);
  }

  const hasStructuredPlan = Boolean(
    plan &&
      ((plan.objects?.length ?? 0) > 0 ||
        (plan.associations?.length ?? 0) > 0 ||
        (plan.workflows?.length ?? 0) > 0 ||
        (plan.implementationChecklist?.length ?? 0) > 0 ||
        Boolean(plan.flowchartMermaid?.trim())),
  );

  return {
    executiveSummary,
    plan,
    hasStructuredPlan,
  };
}

export function serializePlanForPackage(plan: ImplementationPlan): string {
  const copy = { ...plan, executiveSummary: plan.executiveSummary };
  return [
    "## HubSpot implementation plan",
    "",
    "### Executive summary",
    "",
    copy.executiveSummary,
    "",
    "### Structured delivery artifact (JSON)",
    "",
    "```json",
    JSON.stringify(
      {
        title: copy.title,
        objects: copy.objects,
        associations: copy.associations,
        workflows: copy.workflows,
        flowchartMermaid: copy.flowchartMermaid,
        implementationChecklist: copy.implementationChecklist,
      },
      null,
      2,
    ),
    "```",
  ].join("\n");
}
