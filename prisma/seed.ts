import { PrismaClient } from "@prisma/client";

import { DEFAULT_DEV_CLIENT_ID } from "../src/lib/platform/mock-data";

const prisma = new PrismaClient();

async function main() {
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
