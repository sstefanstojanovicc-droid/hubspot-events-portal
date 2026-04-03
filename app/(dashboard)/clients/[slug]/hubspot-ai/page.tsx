import { redirect } from "next/navigation";

import { createHubspotAiThread } from "@/src/lib/hubspot-ai/actions/threads";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { prisma } from "@/src/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

export default async function HubspotAiHomePage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);

  const latest = await prisma.hubspotAiChatThread.findFirst({
    where: { clientAccountId: client.id },
    orderBy: { updatedAt: "desc" },
  });

  if (latest) {
    redirect(`/clients/${slug}/hubspot-ai/thread/${latest.id}`);
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
      <p className="text-slate-700">
        No threads yet. Start one to chat with the assistant and generate write plans.
      </p>
      <form action={createHubspotAiThread} className="mt-4">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="title" value="Implementation kickoff" />
        <button
          type="submit"
          className="rounded-lg bg-hub-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Create first thread
        </button>
      </form>
    </div>
  );
}
