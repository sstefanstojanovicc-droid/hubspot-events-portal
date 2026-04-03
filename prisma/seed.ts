import { PrismaClient } from "@prisma/client";

import { DEFAULT_DEV_CLIENT_ID } from "../src/lib/platform/mock-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.clientAccount.upsert({
    where: { id: DEFAULT_DEV_CLIENT_ID },
    create: {
      id: DEFAULT_DEV_CLIENT_ID,
      name: "Anicca Dev Test Account",
      slug: "anicca-dev-test",
      hubspotPortalId: "46168086",
      connectionStatus: "ready_to_connect",
    },
    update: {
      name: "Anicca Dev Test Account",
      slug: "anicca-dev-test",
      hubspotPortalId: "46168086",
    },
  });
  console.log(`Seeded client account ${DEFAULT_DEV_CLIENT_ID}`);

  const existingTpl = await prisma.actionPlanTemplate.findFirst({
    where: { name: "Onboarding essentials", clientAccountId: null },
  });
  if (!existingTpl) {
    await prisma.actionPlanTemplate.create({
      data: {
        name: "Onboarding essentials",
        description: "Kickoff and discovery checklist (seed).",
        tasks: {
          create: [
            {
              title: "Confirm portal access",
              sortOrder: 0,
              phaseTitle: "Discovery",
              sectionTitle: "Kickoff",
            },
            {
              title: "Discovery workshop",
              sortOrder: 1,
              phaseTitle: "Discovery",
              sectionTitle: "Workshops",
            },
            {
              title: "Handover draft",
              sortOrder: 2,
              phaseTitle: "Delivery",
              sectionTitle: "Closeout",
            },
          ],
        },
      },
    });
    console.log("Seeded action plan template");
  }

  let pkg = await prisma.packageDefinition.findFirst({
    where: { name: "Search Board baseline" },
  });
  if (!pkg) {
    pkg = await prisma.packageDefinition.create({
      data: {
        name: "Search Board baseline",
        description: "Custom objects, associations, and portal wiring for executive search.",
        sourceHubspotPortalId: "46168086",
      },
    });
    await prisma.packageVersion.create({
      data: {
        packageId: pkg.id,
        versionLabel: "0.1.0",
        notes: "Initial seed version.",
      },
    });
    console.log("Seeded package definition + v0.1.0");
  }

  const ver = await prisma.packageVersion.findFirst({
    where: { packageId: pkg.id },
    orderBy: { createdAt: "desc" },
  });
  if (ver) {
    const installed = await prisma.packageInstallation.findFirst({
      where: { packageVersionId: ver.id, clientAccountId: DEFAULT_DEV_CLIENT_ID },
    });
    if (!installed) {
      await prisma.packageInstallation.create({
        data: {
          packageVersionId: ver.id,
          clientAccountId: DEFAULT_DEV_CLIENT_ID,
          status: "installed",
        },
      });
      console.log("Seeded package installation on dev client");
    }
  }

  const tm = await prisma.trainingModule.findFirst({
    where: { title: "Using Hub Workspace", clientAccountId: null },
  });
  if (!tm) {
    await prisma.trainingModule.create({
      data: {
        title: "Using Hub Workspace",
        contentType: "guide",
        body: "This workspace centralizes HubSpot-linked tools, action plans, and packages for your account.",
      },
    });
    await prisma.trainingModule.create({
      data: {
        title: "Search Board quick start",
        contentType: "walkthrough",
        clientAccountId: DEFAULT_DEV_CLIENT_ID,
        body: "Open Search Board from the sidebar, create candidates, and manage shortlists synced to HubSpot.",
      },
    });
    console.log("Seeded training modules");
  }

  const fc = await prisma.fathomCall.findFirst({
    where: { clientAccountId: DEFAULT_DEV_CLIENT_ID, source: "seed" },
  });
  if (!fc) {
    await prisma.fathomCall.create({
      data: {
        clientAccountId: DEFAULT_DEV_CLIENT_ID,
        title: "Seed discovery call",
        callAt: new Date(),
        attendeesJson: JSON.stringify(["Consultant", "Client"]),
        transcript: "Example transcript — replace via webhook or manual entry.",
        summary: "",
        extractionStatus: "pending",
        source: "seed",
      },
    });
    console.log("Seeded sample Fathom call");
  }

  const irCount = await prisma.implementationResource.count({
    where: { clientAccountId: DEFAULT_DEV_CLIENT_ID },
  });
  if (irCount === 0) {
    await prisma.implementationResource.createMany({
      data: [
        {
          clientAccountId: DEFAULT_DEV_CLIENT_ID,
          type: "sow",
          title: "Renewal programme SOW (sample)",
          content: "Annual renewals; 60-day trigger; rep task on new renewal deal.",
        },
        {
          clientAccountId: DEFAULT_DEV_CLIENT_ID,
          type: "company_site",
          title: "Company website",
          url: "https://example.com",
        },
        {
          clientAccountId: DEFAULT_DEV_CLIENT_ID,
          type: "miro_board",
          title: "Process board",
          url: "https://miro.com/app/board/",
        },
      ],
    });
    console.log("Seeded HubSpot AI implementation resources");
  }

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        name: process.env.INITIAL_ADMIN_NAME?.trim() || "Platform admin",
        role: "admin",
        status: "active",
        clientAccountId: null,
      },
      update: {
        role: "admin",
        status: "active",
      },
    });
    console.log(`Seeded admin user for ${adminEmail}`);
  } else {
    console.warn("INITIAL_ADMIN_EMAIL not set — skip admin seed");
  }

  const onboardingTpl = await prisma.actionPlanTemplate.findFirst({
    where: { name: "Onboarding essentials", clientAccountId: null },
    include: { tasks: { orderBy: { sortOrder: "asc" } } },
  });
  if (onboardingTpl?.tasks.length) {
    const phaseBySort: Record<number, string> = {
      0: "Discovery",
      1: "Discovery",
      2: "Delivery",
    };
    for (const t of onboardingTpl.tasks) {
      const ph = phaseBySort[t.sortOrder];
      if (ph && !t.phaseTitle) {
        await prisma.actionPlanTemplateTask.update({
          where: { id: t.id },
          data: { phaseTitle: ph },
        });
      }
    }
  }

  const inviteEmail = process.env.INITIAL_CLIENT_INVITE_EMAIL?.trim().toLowerCase();
  if (inviteEmail) {
    await prisma.invite.upsert({
      where: { email: inviteEmail },
      create: {
        email: inviteEmail,
        role: "client_user",
        clientAccountId: process.env.INITIAL_CLIENT_ACCOUNT_ID?.trim() || DEFAULT_DEV_CLIENT_ID,
      },
      update: {
        role: "client_user",
        clientAccountId:
          process.env.INITIAL_CLIENT_ACCOUNT_ID?.trim() || DEFAULT_DEV_CLIENT_ID,
        consumedAt: null,
      },
    });
    console.log(`Seeded invite for ${inviteEmail}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
