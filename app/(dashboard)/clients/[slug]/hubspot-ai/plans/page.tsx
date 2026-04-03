import Link from "next/link";

import { HubspotAiPlansClient } from "@/src/components/hubspot-ai/hubspot-ai-plans-client";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { prisma } from "@/src/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

export default async function HubspotAiPlansPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);

  const plans = await prisma.hubspotAiWritePlan.findMany({
    where: { clientAccountId: client.id },
    orderBy: { updatedAt: "desc" },
    include: {
      operations: { orderBy: { order: "asc" } },
    },
  });

  const serialisable = plans.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    operationCount: p.operationCount,
    recordsAffected: p.recordsAffected,
    createdAt: p.createdAt.toISOString(),
    approvedAt: p.approvedAt?.toISOString() ?? null,
    operations: p.operations.map((o) => ({
      id: o.id,
      order: o.order,
      type: o.type,
      targetObject: o.targetObject,
      actionSummary: o.actionSummary,
      payloadSummary: o.payloadSummary,
      hubspotUrl: o.hubspotUrl,
    })),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-hub-bar">Write plans</h2>
          <p className="text-sm text-slate-600">
            Review operations, approve, then run (simulated until HubSpot writes are wired).
          </p>
        </div>
        <Link
          href={`/clients/${slug}/hubspot-ai`}
          className="text-sm font-semibold text-hub-ink hover:underline"
        >
          ← Back to assistant
        </Link>
      </div>

      <HubspotAiPlansClient slug={slug} plans={serialisable} />
    </div>
  );
}
