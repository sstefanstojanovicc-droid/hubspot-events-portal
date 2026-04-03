"use server";

import { revalidatePath } from "next/cache";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { prisma } from "@/src/lib/prisma";

export async function addImplementationResource(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const slug = String(formData.get("slug") ?? "");
  const type = String(formData.get("type") ?? "notes").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  const client = await requireClientWorkspaceBySlug(slug);

  await prisma.implementationResource.create({
    data: {
      clientAccountId: client.id,
      type,
      title,
      url: url || null,
      content: content || null,
    },
  });

  revalidatePath(`/clients/${slug}/hubspot-ai`);
  return { ok: true, message: "Resource added." };
}
