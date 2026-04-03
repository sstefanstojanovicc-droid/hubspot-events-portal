import { notFound } from "next/navigation";

import { HubspotAiChatComposer } from "@/src/components/hubspot-ai/hubspot-ai-chat-composer";
import {
  HubspotAiChatPanel,
  type ChatMessageRow,
} from "@/src/components/hubspot-ai/hubspot-ai-chat-panel";
import { HubspotAiPlanToolbar } from "@/src/components/hubspot-ai/hubspot-ai-plan-toolbar";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { prisma } from "@/src/lib/prisma";

type PageProps = { params: Promise<{ slug: string; threadId: string }> };

export default async function HubspotAiThreadPage({ params }: PageProps) {
  const { slug, threadId } = await params;
  const client = await requireClientWorkspaceBySlug(slug);

  const thread = await prisma.hubspotAiChatThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread || thread.clientAccountId !== client.id) {
    notFound();
  }

  const messages: ChatMessageRow[] = thread.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    metadata: m.metadata,
    createdAt: m.createdAt,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-hub-bar">{thread.title}</h2>
        <p className="text-xs text-slate-500">
          Mock assistant · resources from the left sidebar ground responses
        </p>
      </div>

      <HubspotAiPlanToolbar slug={slug} threadId={thread.id} />

      <div className="min-h-[280px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <HubspotAiChatPanel messages={messages} />
      </div>

      <HubspotAiChatComposer slug={slug} threadId={thread.id} />
    </div>
  );
}
