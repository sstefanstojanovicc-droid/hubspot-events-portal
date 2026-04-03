"use server";

import { revalidatePath } from "next/cache";

import {
  IMPLEMENTATION_AGENTS,
  type ImplementationAgentId,
  type ImplementationPlan,
  normalizeImplementationPlan,
  serializePlanForPackage,
} from "@/src/lib/hubspot-ai/admin-implementation-types";
import { generateImplementationPlan } from "@/src/lib/hubspot-ai/admin-implementation-engine";
import { loadPortalInventoryForClient } from "@/src/lib/hubspot-ai/portal-inventory";
import { requirePlatformAdmin } from "@/src/lib/auth/guards";
import { getClientAccountBySlug } from "@/src/lib/platform/client-accounts-repo";
import { listPlatformKnowledgeEntries } from "@/src/lib/platform/knowledge-base-repo";
import {
  createPackageDefinitionWithVersion,
  markNotesAsAiImplementation,
} from "@/src/lib/workspace/packages-repo";
import { listImplementationResourcesForClient } from "@/src/lib/workspace/implementation-resources-repo";
import type { ProjectResource } from "@/src/lib/hubspot-ai/mock-assistant";

const IMPL_BASE = "/admin/apps/hubspot-ai-implementation";

function parseAgent(id: string): ImplementationAgentId {
  const allowed = IMPLEMENTATION_AGENTS.map((a) => a.id);
  if (allowed.includes(id as ImplementationAgentId)) {
    return id as ImplementationAgentId;
  }
  return "full_build";
}

export type RunAdminAssistantState =
  | {
      ok: true;
      plan: ImplementationPlan;
      toolLabels: { label: string; detail?: string }[];
      suggestedTitle?: string;
      usedOpenAI: boolean;
      /** API key present but OpenAI returned an error (quota, billing, etc.). */
      openAiError?: string;
    }
  | { ok: false; message: string };

export async function runAdminImplementationAssistantAction(
  instructions: string,
  clientSlug: string,
  agentId: string,
  previousPlanJson: string | null,
): Promise<RunAdminAssistantState> {
  await requirePlatformAdmin();
  const trimmed = instructions.trim();
  if (!trimmed) {
    return { ok: false, message: "Enter instructions first." };
  }

  const client = await getClientAccountBySlug(clientSlug.trim());
  if (!client) {
    return { ok: false, message: "Unknown client account." };
  }

  const [resourcesRows, kbRows] = await Promise.all([
    listImplementationResourcesForClient(client.id),
    listPlatformKnowledgeEntries(),
  ]);

  const resources: ProjectResource[] = resourcesRows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    url: r.url,
    content: r.content,
  }));

  const knowledge = kbRows.map((k) => ({
    title: k.title,
    body: k.body || k.sourceUrl || "",
    kind: k.kind,
  }));

  let previousPlan: ImplementationPlan | null = null;
  if (previousPlanJson?.trim()) {
    try {
      previousPlan = normalizeImplementationPlan(JSON.parse(previousPlanJson) as unknown);
    } catch {
      previousPlan = null;
    }
  }

  const agent = parseAgent(agentId);
  const portalInventory = await loadPortalInventoryForClient(client.hubspotPortalId);
  const result = await generateImplementationPlan({
    instructions: trimmed,
    agent,
    clientName: client.name,
    resources,
    knowledge,
    previousPlan,
    portalInventory,
  });

  return {
    ok: true,
    plan: result.plan,
    toolLabels: result.toolLabels,
    suggestedTitle: result.plan.title,
    usedOpenAI: result.usedOpenAI,
    openAiError: result.openAiError,
  };
}

export async function createPackageFromAiBuilderAction(
  _prev: { ok: boolean; message: string; packageId?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string; packageId?: string }> {
  await requirePlatformAdmin();
  const clientSlug = String(formData.get("clientSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const portalId = String(formData.get("sourceHubspotPortalId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const planJson = String(formData.get("planJson") ?? "").trim();

  if (!name) {
    return { ok: false, message: "Package name is required." };
  }
  if (!planJson) {
    return { ok: false, message: "No plan to save — run the assistant first." };
  }

  let plan: ImplementationPlan;
  try {
    plan = normalizeImplementationPlan(JSON.parse(planJson) as unknown);
  } catch {
    return { ok: false, message: "Invalid plan payload." };
  }

  const client = await getClientAccountBySlug(clientSlug);
  if (!client) {
    return { ok: false, message: "Unknown client account." };
  }

  const portal = portalId.trim() || client.hubspotPortalId;
  const implementationBody = serializePlanForPackage(plan);

  const created = await createPackageDefinitionWithVersion({
    name,
    description: description || "Generated from HubSpot AI Implementation workspace.",
    sourceHubspotPortalId: portal || null,
    clientAccountId: client.id,
    versionLabel: "1.0",
    versionNotes: markNotesAsAiImplementation(implementationBody),
  });

  revalidatePath(`${IMPL_BASE}/${client.slug}/packages`, "page");
  revalidatePath(`${IMPL_BASE}/${client.slug}/versions`, "page");
  revalidatePath("/admin/package-library");
  revalidatePath(IMPL_BASE, "layout");

  const firstVersion = created.versions[0];
  return {
    ok: true,
    message: firstVersion
      ? `Package created with version ${firstVersion.versionLabel}.`
      : "Package created.",
    packageId: created.id,
  };
}
