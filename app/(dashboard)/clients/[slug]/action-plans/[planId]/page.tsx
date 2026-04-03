import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionPlanSuperedDetail } from "@/src/components/workspace/action-plan-supered-detail";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import {
  getActionPlanById,
  groupPlanTasksForUi,
} from "@/src/lib/workspace/action-plans-repo";

type PageProps = { params: Promise<{ slug: string; planId: string }> };

export default async function ActionPlanDetailPage({ params }: PageProps) {
  const { slug, planId } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const plan = await getActionPlanById(planId, client.id);

  if (!plan) {
    notFound();
  }

  const { phaseOrder, map } = groupPlanTasksForUi(plan.tasks);
  const phases = phaseOrder.map((phaseTitle) => {
    const secMap = map.get(phaseTitle)!;
    return {
      title: phaseTitle,
      sections: [...secMap.entries()].map(([sectionTitle, tasks]) => ({
        title: sectionTitle,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          done: t.done,
          dueAt: t.dueAt?.toISOString() ?? null,
          assignee: t.assignee
            ? { name: t.assignee.name, email: t.assignee.email }
            : null,
          cards: t.cards.map((c) => ({
            id: c.id,
            cardType: c.cardType,
            payloadJson: c.payloadJson,
          })),
        })),
      })),
    };
  });

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link
          href={`/clients/${client.slug}/action-plans`}
          className="font-medium text-hub-ink hover:underline"
        >
          ← Action Plans
        </Link>
      </nav>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Plan</p>
        <h1 className="text-2xl font-semibold text-hub-bar">{plan.title}</h1>
        <p className="mt-2 text-sm text-slate-600 capitalize">
          {plan.status.replaceAll("_", " ")}
          {plan.template ? ` · template: ${plan.template.name}` : ""}
        </p>
      </header>

      <ActionPlanSuperedDetail
        phases={phases}
        clientId={client.id}
        clientSlug={client.slug}
        planId={plan.id}
        hubspotPortalId={client.hubspotPortalId}
      />
    </div>
  );
}
