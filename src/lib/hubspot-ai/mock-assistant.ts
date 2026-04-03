export type ToolActivity = { label: string; detail?: string };

export type MockAssistantResult = {
  toolActivities: ToolActivity[];
  assistantMarkdown: string;
  suggestWritePlanTitle?: string;
};

export type ProjectResource = {
  id: string;
  type: string;
  title: string;
  url: string | null;
  content: string | null;
};

export type KnowledgeSnippet = {
  title: string;
  body: string;
  kind: string;
};

const DEFAULT_TOOLS: ToolActivity[] = [
  { label: "Portal status", detail: "Using this workspace HubSpot portal id (mock snapshot)." },
  { label: "Inspect schemas", detail: "Loaded deal property catalogue (mock snapshot)." },
  { label: "Inspect pipelines", detail: "Checked deal pipelines for Renewals usage." },
];

function knowledgeGroundingBlock(knowledge?: KnowledgeSnippet[]): string {
  if (!knowledge?.length) return "";
  const lines = knowledge.slice(0, 8).map((k) => {
    const excerpt = k.body.replace(/\s+/g, " ").trim().slice(0, 220);
    return `- **${k.title}** (${k.kind})${excerpt ? ` — _${excerpt}${k.body.length > 220 ? "…" : ""}_` : ""}`;
  });
  return ["", "### HubSpot Knowledge Base (platform)", ...lines, ""].join("\n");
}

export function runMockAssistant(
  userMessage: string,
  resources?: ProjectResource[],
  knowledge?: KnowledgeSnippet[],
): MockAssistantResult {
  const lower = userMessage.toLowerCase();
  const kbBlock = knowledgeGroundingBlock(knowledge);

  if (lower.includes("renewal")) {
    const resourceTitles =
      resources?.map((r) => r.title).filter(Boolean).slice(0, 6) ?? [];
    return {
      toolActivities: [
        ...DEFAULT_TOOLS,
        { label: "Inspect workflows", detail: "Listed deal-based workflows (metadata)." },
        ...(resources && resources.length > 0
          ? [
              {
                label: "Loaded project resources",
                detail: `Using ${resources.length} resource(s) to ground the plan.`,
              },
            ]
          : []),
        ...(knowledge && knowledge.length > 0
          ? [
              {
                label: "Applied Knowledge Base",
                detail: `${knowledge.length} article(s) / rule(s) merged into context.`,
              },
            ]
          : []),
        { label: "Prepare write plan", detail: "Drafting CREATE_PROPERTY + CREATE_WORKFLOW operations." },
      ],
      suggestWritePlanTitle: "Implement annual deal renewals system",
      assistantMarkdown: [
        "### Portal findings",
        "- A **Renewals** deal pipeline already exists with a **Renewal Due** stage — reuse it instead of creating a duplicate.",
        "- Prefer **`contract_end_date`** (explicit term end) over `closedate` for the 60-day trigger unless your closedate always mirrors contract end.",
        "",
        "### Recommended architecture",
        "1. **Properties** — store contract start/end, eligibility flags, renewal deal naming, and idempotency (`renewal_created`).",
        "2. **Workflow A** — native date calculation where possible; add **custom code** only if you need business-day logic or exceptions.",
        "3. **Workflow B** — enroll **60 days before** `contract_end_date`, guard with `renewal_eligible` and `renewal_created = false`, create renewal deal in the Renewals pipeline, copy associations, create a call task, then stamp the source deal.",
        resources && resources.length > 0
          ? [
              "",
              "### Grounding notes (from your resources)",
              `- ${resourceTitles.map((t) => `“${t}”`).join(", ")}`,
              "- The plan below reflects your explicit idempotency + 60-day trigger requirements.",
            ].join("\n")
          : "",
        kbBlock,
        "",
        "_This assistant uses **mock** inspection steps. Wire OpenAI + live CRM reads when you are ready._",
        "",
        "Use **Generate write plan** to materialise reviewable operations.",
      ].join("\n"),
    };
  }

  const resourceHint =
    resources && resources.length > 0
      ? `\n\n### Context in play\n${resources
          .slice(0, 5)
          .map((r) => `- **${r.title}** (${r.type})`)
          .join("\n")}`
      : "";

  return {
    toolActivities: [
      ...DEFAULT_TOOLS,
      ...(knowledge && knowledge.length > 0
        ? [{ label: "Applied Knowledge Base", detail: `${knowledge.length} snippet(s).` }]
        : []),
    ],
    assistantMarkdown: [
      "I can help design HubSpot automation with a **reviewable Write Plan** before any API writes.",
      "",
      "Try asking about a **renewal system** for annual deals, or describe another build.",
      resourceHint,
      kbBlock || (knowledge?.length ? "\n\n_Knowledge base entries are loaded; the live model will use them when wired._\n" : ""),
    ].join("\n"),
  };
}
