import { HubspotAiSidebar } from "@/src/components/hubspot-ai/hubspot-ai-sidebar";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { prisma } from "@/src/lib/prisma";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function HubspotAiLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);

  const [threads, resources] = await Promise.all([
    prisma.hubspotAiChatThread.findMany({
      where: { clientAccountId: client.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.implementationResource.findMany({
      where: { clientAccountId: client.id },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { id: true, type: true, title: true, url: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          HubSpot AI Implementation
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-hub-bar">
          Planning &amp; write plans
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {client.name} · portal <span className="font-mono">{client.hubspotPortalId}</span>
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <HubspotAiSidebar
          client={client}
          threads={threads}
          resources={resources}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
