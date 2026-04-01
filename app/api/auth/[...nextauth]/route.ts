import type { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { prisma } from "@/src/lib/prisma";

let databaseChecked = false;

async function logDatabaseHealthOnce() {
  if (databaseChecked) return;
  databaseChecked = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[auth] Prisma connection failed:", message);
    console.error(
      "[auth] Check DATABASE_URL. For local SQLite use file:./dev.db (relative to prisma/). Run: npx prisma db push",
    );
  }
}

export async function GET(req: NextRequest) {
  await logDatabaseHealthOnce();
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  await logDatabaseHealthOnce();
  return handlers.POST(req);
}
