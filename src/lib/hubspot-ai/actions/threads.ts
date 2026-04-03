"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { prisma } from "@/src/lib/prisma";

export async function createHubspotAiThread(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const titleRaw = String(formData.get("title") ?? "").trim();
  const client = await requireClientWorkspaceBySlug(slug);
  const thread = await prisma.hubspotAiChatThread.create({
    data: {
      clientAccountId: client.id,
      title: titleRaw || "New implementation thread",
    },
  });
  revalidatePath(`/clients/${slug}/hubspot-ai`);
  redirect(`/clients/${slug}/hubspot-ai/thread/${thread.id}`);
}
