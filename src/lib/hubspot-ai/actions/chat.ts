"use server";

import { revalidatePath } from "next/cache";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { runMockAssistant } from "@/src/lib/hubspot-ai/mock-assistant";
import { ingestPortalContextMock } from "@/src/lib/hubspot-ai/portal-context";
import { prisma } from "@/src/lib/prisma";

export async function sendHubspotAiChatMessage(
  slug: string,
  threadId: string,
  content: string,
) {
  const client = await requireClientWorkspaceBySlug(slug);
  const thread = await prisma.hubspotAiChatThread.findUnique({
    where: { id: threadId },
  });
  if (!thread || thread.clientAccountId !== client.id) {
    throw new Error("Thread not found");
  }

  await prisma.hubspotAiChatMessage.create({
    data: {
      threadId,
      role: "user",
      content: content.trim(),
    },
  });

  await ingestPortalContextMock({
    clientAccountId: client.id,
    hubspotPortalId: client.hubspotPortalId,
  });

  const resources = await prisma.implementationResource.findMany({
    where: { clientAccountId: client.id },
    select: {
      id: true,
      type: true,
      title: true,
      url: true,
      content: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const mock = runMockAssistant(content, resources);

  await prisma.hubspotAiChatMessage.create({
    data: {
      threadId,
      role: "assistant",
      content: mock.assistantMarkdown,
      metadata: JSON.stringify({
        toolActivities: mock.toolActivities,
        suggestWritePlanTitle: mock.suggestWritePlanTitle,
      }),
    },
  });

  revalidatePath(`/clients/${slug}/hubspot-ai/thread/${threadId}`);
  return { ok: true };
}
