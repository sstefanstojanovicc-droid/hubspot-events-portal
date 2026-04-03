import "server-only";

import { prisma } from "@/src/lib/prisma";

export async function listActionPlanTemplatesForClient(clientAccountId: string) {
  return prisma.actionPlanTemplate.findMany({
    where: {
      OR: [{ clientAccountId: null }, { clientAccountId }],
    },
    orderBy: { name: "asc" },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function listActionPlansForClient(clientAccountId: string) {
  return prisma.actionPlan.findMany({
    where: { clientAccountId },
    orderBy: { updatedAt: "desc" },
    include: {
      template: { select: { id: true, name: true } },
      tasks: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getActionPlanById(planId: string, clientAccountId: string) {
  return prisma.actionPlan.findFirst({
    where: { id: planId, clientAccountId },
    include: {
      template: true,
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          cards: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
}

function introCardPayload(title: string): string {
  return JSON.stringify({
    text: `Work through this step: **${title}**. Add notes and links using cards as the plan evolves.`,
  });
}

export async function createActionPlanFromTemplate(input: {
  clientAccountId: string;
  templateId: string;
  title?: string;
}) {
  const template = await prisma.actionPlanTemplate.findFirst({
    where: {
      id: input.templateId,
      OR: [{ clientAccountId: null }, { clientAccountId: input.clientAccountId }],
    },
    include: { tasks: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) {
    throw new Error("Template not found.");
  }
  const title = input.title?.trim() || template.name;
  return prisma.actionPlan.create({
    data: {
      clientAccountId: input.clientAccountId,
      templateId: template.id,
      title,
      tasks: {
        create: template.tasks.map((t) => ({
          title: t.title,
          phaseTitle: t.phaseTitle,
          sectionTitle: t.sectionTitle,
          sortOrder: t.sortOrder,
          cards: {
            create: [
              {
                cardType: "text",
                sortOrder: 0,
                payloadJson: introCardPayload(t.title),
              },
            ],
          },
        })),
      },
    },
    include: { tasks: { include: { cards: true } } },
  });
}

export async function createManualActionPlan(input: {
  clientAccountId: string;
  title: string;
}) {
  return prisma.actionPlan.create({
    data: {
      clientAccountId: input.clientAccountId,
      title: input.title.trim(),
      tasks: {
        create: [
          {
            title: "Kickoff checklist",
            phaseTitle: "Discovery",
            sectionTitle: "Planning",
            sortOrder: 0,
            cards: {
              create: [
                {
                  cardType: "checklist",
                  sortOrder: 0,
                  payloadJson: JSON.stringify({
                    items: [
                      "Confirm scope with stakeholders",
                      "Validate HubSpot portal access",
                      "Schedule working sessions",
                    ],
                  }),
                },
                {
                  cardType: "warning",
                  sortOrder: 1,
                  payloadJson: JSON.stringify({
                    message: "Escalate blockers early — note them in task comments when that ships.",
                  }),
                },
              ],
            },
          },
        ],
      },
    },
    include: { tasks: { include: { cards: true } } },
  });
}

export async function setActionPlanTaskDone(input: {
  taskId: string;
  planId: string;
  clientAccountId: string;
  done: boolean;
}) {
  const task = await prisma.actionPlanTask.findFirst({
    where: {
      id: input.taskId,
      planId: input.planId,
      plan: { clientAccountId: input.clientAccountId },
    },
  });
  if (!task) {
    throw new Error("Task not found.");
  }
  return prisma.actionPlanTask.update({
    where: { id: input.taskId },
    data: { done: input.done },
  });
}

export async function countActiveActionPlans(clientAccountId: string) {
  return prisma.actionPlan.count({
    where: { clientAccountId, status: "active" },
  });
}

export async function countOverdueTasks(clientAccountId: string) {
  const now = new Date();
  return prisma.actionPlanTask.count({
    where: {
      done: false,
      dueAt: { lt: now },
      plan: { clientAccountId, status: "active" },
    },
  });
}

/** Group tasks for Supered-style UI: phase → section → tasks. */
export function groupPlanTasksForUi<
  T extends {
    phaseTitle: string | null;
    sectionTitle: string | null;
    sortOrder: number;
  },
>(tasks: T[]) {
  const phaseOrder: string[] = [];
  const map = new Map<string, Map<string, T[]>>();
  for (const t of tasks) {
    const ph = t.phaseTitle?.trim() || "General";
    const sec = t.sectionTitle?.trim() || "Tasks";
    if (!map.has(ph)) {
      map.set(ph, new Map());
      phaseOrder.push(ph);
    }
    const sm = map.get(ph)!;
    if (!sm.has(sec)) {
      sm.set(sec, []);
    }
    sm.get(sec)!.push(t);
  }
  for (const sm of map.values()) {
    for (const arr of sm.values()) {
      arr.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }
  return { phaseOrder, map };
}
