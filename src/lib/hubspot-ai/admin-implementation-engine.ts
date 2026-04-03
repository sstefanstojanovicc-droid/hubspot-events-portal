import "server-only";

import OpenAI from "openai";

import type { KnowledgeSnippet, ProjectResource } from "@/src/lib/hubspot-ai/mock-assistant";
import {
  type ImplementationAgentId,
  type ImplementationPlan,
  normalizeImplementationPlan,
} from "@/src/lib/hubspot-ai/admin-implementation-types";
import type { PortalInventoryForPrompt } from "@/src/lib/hubspot-ai/portal-inventory";

const JSON_INSTRUCTION = `You are a senior HubSpot Solutions Architect. Respond with a single JSON object only (no markdown outside JSON), using this exact shape:
{
  "title": "short implementation title",
  "executiveSummary": "markdown-friendly narrative: scope, assumptions, sequencing, risks, plus a short 'Existing portal reuse' sentence when inventory lists assets you kept",
  "objects": [{ "apiName": "deal|contact|company|custom:xxx", "label": "", "purpose": "", "properties": [{ "name": "internal_name", "label": "", "type": "string|number|enumeration|date|bool", "purpose": "" }] }],
  "associations": [{ "from": "object api name", "to": "object api name", "label": "association label", "cardinality": "1:N|N:N|..." }],
  "workflows": [{ "name": "", "type": "workflow|sequence|playbook", "trigger": "", "steps": [{ "order": 1, "name": "", "detail": "" }] }],
  "flowchartMermaid": "A valid Mermaid flowchart or graph TD/flowchart LR string showing the main automation/data flow. Keep labels short, ASCII only, no parentheses in node text if possible.",
  "implementationChecklist": ["ordered rollout tasks"]
}
Ground answers in HubSpot best practices. If information is missing, state assumptions explicitly in executiveSummary.
Keep flowchartMermaid concise (under 25 nodes).

When a "Current portal inventory" section is provided: those custom objects, sampled standard properties, and pipelines already exist. Do NOT propose creating duplicates — reuse labels/internal names, extend with new properties only when needed, or explicitly justify net-new objects.`;

const AGENT_FOCUS: Record<ImplementationAgentId, string> = {
  full_build:
    "Balance CRM data model, automation, and rollout. Include at least 2 objects or clarify standard objects, 2+ associations if relevant, and 2+ workflows or sequences.",
  data_model:
    "Prioritize objects, properties, and associations. Include granular property definitions and cardinality. Fewer workflow steps unless essential.",
  automation:
    "Prioritize workflows, enrollment logic, handoffs, and operational alerts. Tie each workflow to triggers and outcomes. Still list core objects touched.",
  governance:
    "Prioritize teams, permissions, data hygiene, naming conventions, duplicate management, and audit considerations. Include guardrail workflows where relevant.",
};

function buildContextBlock(
  clientName: string,
  resources: ProjectResource[],
  knowledge: KnowledgeSnippet[],
): string {
  const res =
    resources.length === 0
      ? "(No client resources uploaded — rely on instructions and HubSpot defaults.)"
      : resources
          .map((r) => `### ${r.type}: ${r.title}\n${r.content ?? r.url ?? ""}`)
          .join("\n\n");
  const kb =
    knowledge.length === 0
      ? "(No global Knowledge Base entries.)"
      : knowledge
          .map((k) => `### [${k.kind}] ${k.title}\n${k.body}`)
          .slice(0, 12)
          .join("\n\n");
  return [`## Client: ${clientName}`, "", "## Client resources", res, "", "## Global Knowledge Base (HubSpot rules)", kb].join(
    "\n",
  );
}

function extractJsonFromCompletion(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      return null;
    }
  }
  return null;
}

function buildMockPlan(
  instructions: string,
  agent: ImplementationAgentId,
  resources: ProjectResource[],
  knowledge: KnowledgeSnippet[],
  clientName: string,
  portalInventoryMarkdown: string,
): ImplementationPlan {
  const resourceNames = resources.map((r) => r.title).filter(Boolean);
  const kbTitles = knowledge.map((k) => k.title).slice(0, 4);
  const summaryParts = [
    `**Scope** — ${instructions.slice(0, 400)}${instructions.length > 400 ? "…" : ""}`,
    "",
    resourceNames.length
      ? `**Grounding resources:** ${resourceNames.join(", ")}.`
      : "_No client resources — add files under Resources for richer output._",
    kbTitles.length ? `\n**Knowledge base applied:** ${kbTitles.join("; ")}.` : "",
    "",
    `**Agent profile:** ${agent.replace("_", " ")}.`,
    "",
    portalInventoryMarkdown.trim()
      ? ["### Portal inventory (live check)", portalInventoryMarkdown.slice(0, 4000), ""].join("\n")
      : "",
    "",
    "_Mock mode: set `OPENAI_API_KEY` for live GPT structuring._",
  ];

  return {
    title: `${clientName} — implementation draft`,
    executiveSummary: summaryParts.join("\n"),
    objects: [
      {
        apiName: "deal",
        label: "Deal",
        purpose: "Primary pipeline object for this programme.",
        properties: [
          { name: "implementation_phase", label: "Phase", type: "enumeration", purpose: "Track delivery stage." },
          { name: "success_owner", label: "Success owner", type: "string", purpose: "Named CSM or consultant." },
        ],
      },
      {
        apiName: "contact",
        label: "Contact",
        purpose: "Stakeholders and champions.",
        properties: [
          { name: "role_in_programme", label: "Role", type: "enumeration", purpose: "Champion | Blocker | User." },
        ],
      },
    ],
    associations: [
      { from: "contact", to: "deal", label: "Influences", cardinality: "N:N" },
      { from: "company", to: "deal", cardinality: "1:N" },
    ],
    workflows: [
      {
        name: "Stage exit validation",
        type: "workflow",
        trigger: "Deal stage moves to Closed won",
        steps: [
          { order: 1, name: "Check required properties", detail: "Block if key fields empty." },
          { order: 2, name: "Notify slack / email", detail: "Alert delivery pod." },
        ],
      },
      {
        name: "Handoff to services",
        type: "workflow",
        trigger: "Lifecycle stage becomes customer",
        steps: [{ order: 1, name: "Create onboarding deal", detail: "Spin child record in Services pipeline." }],
      },
    ],
    flowchartMermaid:
      "flowchart LR\n  A[Trigger] --> B{Valid?}\n  B -->|Yes| C[Update CRM]\n  B -->|No| D[Notify rep]\n  C --> E[Task created]",
    implementationChecklist: [
      "Confirm standard vs custom objects in portal",
      "Create properties in sandbox",
      "Build workflows in draft",
      "User acceptance with champions",
      "Production promote + package export",
    ],
  };
}

export type EngineToolLabel = { label: string; detail?: string };

export async function generateImplementationPlan(input: {
  instructions: string;
  agent: ImplementationAgentId;
  clientName: string;
  resources: ProjectResource[];
  knowledge: KnowledgeSnippet[];
  previousPlan: ImplementationPlan | null;
  portalInventory: PortalInventoryForPrompt;
}): Promise<{
  plan: ImplementationPlan;
  toolLabels: EngineToolLabel[];
  usedOpenAI: boolean;
  model?: string;
  /** Set when OPENAI_API_KEY is present but the request failed (e.g. 429 billing). */
  openAiError?: string;
}> {
  const { instructions, agent, clientName, resources, knowledge, previousPlan, portalInventory } =
    input;

  const toolLabels: EngineToolLabel[] = [
    { label: "Context", detail: `${resources.length} client resource(s)` },
    { label: "Knowledge Base", detail: `${knowledge.length} global entr${knowledge.length === 1 ? "y" : "ies"}` },
    { label: "Portal inventory", detail: portalInventory.toolDetail },
  ];

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    toolLabels.push({ label: "Model", detail: "Mock (add OPENAI_API_KEY)" });
    return {
      plan: buildMockPlan(
        instructions,
        agent,
        resources,
        knowledge,
        clientName,
        portalInventory.summaryMarkdown,
      ),
      toolLabels,
      usedOpenAI: false,
    };
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const system = [
    JSON_INSTRUCTION,
    "",
    "Focus for this run:",
    AGENT_FOCUS[agent],
  ].join("\n");

  const context = buildContextBlock(clientName, resources, knowledge);
  const userParts = [
    context,
    "",
    "## New instructions from consultant",
    instructions,
  ];
  if (previousPlan) {
    userParts.push(
      "",
      "## Previous plan (refine, do not discard valid structure unless asked)",
      JSON.stringify(previousPlan),
    );
  }

  userParts.push(
    "",
    "## Current portal inventory (system snapshot — avoid duplicates; reuse or extend)",
    portalInventory.summaryMarkdown,
  );

  toolLabels.push({ label: "Model", detail: model });

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.35,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userParts.join("\n") },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const raw = extractJsonFromCompletion(text);
    if (!raw || typeof raw !== "object") {
      toolLabels.push({ label: "Parse fallback", detail: "Using normalized partial plan" });
      return {
        plan: normalizeImplementationPlan({
          executiveSummary:
            text.slice(0, 8000) ||
            "Model returned empty content. Check API quota or reduce context.",
        }),
        toolLabels,
        usedOpenAI: true,
        model,
      };
    }
    const plan = normalizeImplementationPlan(raw);
    return { plan, toolLabels, usedOpenAI: true, model };
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : typeof e === "object" && e !== null && "message" in e
        ? String((e as { message: unknown }).message)
        : "OpenAI request failed";
    toolLabels.push({ label: "OpenAI error", detail: msg.slice(0, 120) });
    return {
      plan: buildMockPlan(
        instructions,
        agent,
        resources,
        knowledge,
        clientName,
        portalInventory.summaryMarkdown,
      ),
      toolLabels,
      usedOpenAI: false,
      model: undefined,
      openAiError: msg,
    };
  }
}
