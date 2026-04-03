"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  assertClientAccountAccess,
  requirePlatformAdmin,
} from "@/src/lib/auth/guards";
import {
  createActionPlanFromTemplate,
  createManualActionPlan,
  setActionPlanTaskDone,
} from "@/src/lib/workspace/action-plans-repo";
import { createFathomCall, setFathomExtractionStatus } from "@/src/lib/workspace/fathom-repo";
import { logActivity } from "@/src/lib/workspace/activity-log";
import { installPackageVersionForClient } from "@/src/lib/workspace/packages-repo";
import {
  touchClientHubSpotSyncAt,
  updateClientWorkspaceProfile,
} from "@/src/lib/platform/client-accounts-repo";
export type SimpleActionState = { ok: boolean; message: string };

const ok = (m: string): SimpleActionState => ({ ok: true, message: m });
const fail = (m: string): SimpleActionState => ({ ok: false, message: m });

function revalidateActionPlans(slug: string, planId?: string) {
  if (!slug) {
    return;
  }
  revalidatePath(`/clients/${slug}/action-plans`);
  if (planId) {
    revalidatePath(`/clients/${slug}/action-plans/${planId}`);
  }
  revalidatePath(`/clients/${slug}`);
}

function revalidateFathom(slug: string, callId?: string) {
  if (!slug) {
    return;
  }
  revalidatePath(`/clients/${slug}/fathom-calls`);
  if (callId) {
    revalidatePath(`/clients/${slug}/fathom-calls/${callId}`);
  }
  revalidatePath(`/clients/${slug}`);
}

export async function createPlanFromTemplateAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("Sign in required.");
  }
  const clientId = String(formData.get("clientAccountId") ?? "");
  const clientSlug = String(formData.get("clientSlug") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  assertClientAccountAccess(session, clientId);
  if (!templateId) {
    return fail("Pick a template.");
  }
  try {
    await createActionPlanFromTemplate({
      clientAccountId: clientId,
      templateId,
      title: title || undefined,
    });
    await logActivity({
      clientAccountId: clientId,
      userId: session.user.id,
      action: "action_plan.created_from_template",
      entityType: "action_plan",
      details: { templateId },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not create plan.");
  }
  revalidateActionPlans(clientSlug);
  return ok("Plan created.");
}

export async function createManualPlanAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("Sign in required.");
  }
  const clientId = String(formData.get("clientAccountId") ?? "");
  const clientSlug = String(formData.get("clientSlug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  assertClientAccountAccess(session, clientId);
  if (!title) {
    return fail("Title is required.");
  }
  try {
    await createManualActionPlan({ clientAccountId: clientId, title });
    await logActivity({
      clientAccountId: clientId,
      userId: session.user.id,
      action: "action_plan.created_manual",
      entityType: "action_plan",
      details: { title },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not create plan.");
  }
  revalidateActionPlans(clientSlug);
  return ok("Plan created.");
}

export async function toggleActionPlanTaskAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("Sign in required.");
  }
  const clientId = String(formData.get("clientAccountId") ?? "");
  const clientSlug = String(formData.get("clientSlug") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  assertClientAccountAccess(session, clientId);
  try {
    await setActionPlanTaskDone({
      clientAccountId: clientId,
      planId,
      taskId,
      done,
    });
    await logActivity({
      clientAccountId: clientId,
      userId: session.user.id,
      action: done ? "action_plan.task_completed" : "action_plan.task_reopened",
      entityType: "action_plan_task",
      entityId: taskId,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not update task.");
  }
  revalidateActionPlans(clientSlug, planId);
  return ok(done ? "Marked complete." : "Reopened.");
}

export async function createFathomCallAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("Sign in required.");
  }
  const clientId = String(formData.get("clientAccountId") ?? "");
  const clientSlug = String(formData.get("clientSlug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const callAtRaw = String(formData.get("callAt") ?? "");
  assertClientAccountAccess(session, clientId);
  if (!title) {
    return fail("Title is required.");
  }
  const callAt = callAtRaw ? new Date(callAtRaw) : new Date();
  if (!Number.isFinite(callAt.getTime())) {
    return fail("Invalid date.");
  }
  const transcript = String(formData.get("transcript") ?? "");
  try {
    const row = await createFathomCall({
      clientAccountId: clientId,
      title,
      callAt,
      transcript,
      source: "manual",
    });
    await logActivity({
      clientAccountId: clientId,
      userId: session.user.id,
      action: "fathom.call_created",
      entityType: "fathom_call",
      entityId: row.id,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not save call.");
  }
  revalidateFathom(clientSlug);
  return ok("Call recorded.");
}

export async function runFathomExtractionStubAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("Sign in required.");
  }
  const clientId = String(formData.get("clientAccountId") ?? "");
  const clientSlug = String(formData.get("clientSlug") ?? "");
  const callId = String(formData.get("callId") ?? "");
  assertClientAccountAccess(session, clientId);
  await setFathomExtractionStatus(callId, clientId, "processing");
  await setFathomExtractionStatus(
    callId,
    clientId,
    "done",
    "Stub extraction: requirements and action items would be generated here from the transcript.",
  );
  await logActivity({
    clientAccountId: clientId,
    userId: session.user.id,
    action: "fathom.extraction_stub",
    entityType: "fathom_call",
    entityId: callId,
  });
  revalidateFathom(clientSlug, callId);
  return ok("Extraction finished (stub).");
}

export async function installPackageToClientAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  await requirePlatformAdmin();
  const clientRef = String(formData.get("clientRef") ?? "");
  const parts = clientRef.split("|");
  const clientId = parts[0] ?? "";
  const clientSlug = parts[1] ?? "";
  const versionId = String(formData.get("packageVersionId") ?? "");
  if (!clientId || !versionId) {
    return fail("Missing package or client.");
  }
  try {
    await installPackageVersionForClient({
      clientAccountId: clientId,
      packageVersionId: versionId,
    });
    await logActivity({
      clientAccountId: clientId,
      action: "package.installed",
      entityType: "package_installation",
      details: { packageVersionId: versionId },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Install failed.");
  }
  revalidatePath("/admin/package-library");
  if (clientSlug) {
    revalidatePath(`/clients/${clientSlug}/packages`);
    revalidatePath(`/clients/${clientSlug}`);
  }
  return ok("Package installed on client.");
}

/** Next.js `<form action>` expects `Promise<void>` — discard return state. */
export async function installPackageToClientFormAction(formData: FormData): Promise<void> {
  await installPackageToClientAction(undefined, formData);
}

export async function createPlanFromTemplateFormAction(formData: FormData): Promise<void> {
  await createPlanFromTemplateAction(undefined, formData);
}

export async function createManualPlanFormAction(formData: FormData): Promise<void> {
  await createManualPlanAction(undefined, formData);
}

export async function createFathomCallFormAction(formData: FormData): Promise<void> {
  await createFathomCallAction(undefined, formData);
}

export async function runFathomExtractionStubFormAction(formData: FormData): Promise<void> {
  await runFathomExtractionStubAction(undefined, formData);
}

export async function syncHubSpotNowAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("Sign in required.");
  }
  const clientId = String(formData.get("clientAccountId") ?? "");
  const clientSlug = String(formData.get("clientSlug") ?? "");
  assertClientAccountAccess(session, clientId);
  try {
    await touchClientHubSpotSyncAt(clientId);
    await logActivity({
      clientAccountId: clientId,
      userId: session.user.id,
      action: "hubspot.sync_requested",
      entityType: "client_account",
      details: { source: "dashboard_manual" },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Sync could not be recorded.");
  }
  revalidatePath(`/clients/${clientSlug}`);
  return ok("Sync timestamp updated. Full CRM sync runs when connected apps refresh data.");
}

export async function updateClientWorkspaceProfileAction(
  _prev: SimpleActionState | undefined,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("Sign in required.");
  }
  const clientId = String(formData.get("clientAccountId") ?? "");
  const clientSlug = String(formData.get("clientSlug") ?? "");
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const rawContacts = String(formData.get("primaryContactsJson") ?? "").trim();
  const primaryContactsJson = rawContacts || "[]";
  assertClientAccountAccess(session, clientId);
  if (rawContacts) {
    try {
      const parsed = JSON.parse(rawContacts) as unknown;
      if (!Array.isArray(parsed)) {
        return fail("Primary contacts must be a JSON array, e.g. [{\"name\":\"\",\"email\":\"\"}].");
      }
    } catch {
      return fail("Primary contacts must be valid JSON.");
    }
  }
  try {
    await updateClientWorkspaceProfile({
      clientAccountId: clientId,
      websiteUrl,
      primaryContactsJson,
    });
    await logActivity({
      clientAccountId: clientId,
      userId: session.user.id,
      action: "client.profile_updated",
      entityType: "client_account",
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not save profile.");
  }
  revalidatePath(`/clients/${clientSlug}`);
  revalidatePath(`/clients/${clientSlug}/settings`);
  revalidatePath(`/clients/${clientSlug}/settings/general`);
  return ok("Profile saved.");
}

export async function syncHubSpotNowFormAction(formData: FormData): Promise<void> {
  await syncHubSpotNowAction(undefined, formData);
}

export async function updateClientWorkspaceProfileFormAction(formData: FormData): Promise<void> {
  await updateClientWorkspaceProfileAction(undefined, formData);
}
