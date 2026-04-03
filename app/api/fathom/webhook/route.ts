import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { logActivity } from "@/src/lib/workspace/activity-log";

type WebhookBody = {
  clientAccountId?: string;
  title?: string;
  callAt?: string;
  transcript?: string;
  summary?: string;
  attendees?: string[];
  source?: string;
};

export async function POST(request: Request) {
  const secret = process.env.FATHOM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization")?.trim();
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientAccountId = body.clientAccountId?.trim();
  if (!clientAccountId) {
    return NextResponse.json({ error: "clientAccountId required" }, { status: 400 });
  }

  const client = await prisma.clientAccount.findUnique({ where: { id: clientAccountId } });
  if (!client) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  const title = body.title?.trim() || "Imported call";
  const callAt = body.callAt ? new Date(body.callAt) : new Date();
  if (!Number.isFinite(callAt.getTime())) {
    return NextResponse.json({ error: "Invalid callAt" }, { status: 400 });
  }

  const row = await prisma.fathomCall.create({
    data: {
      clientAccountId,
      title,
      callAt,
      attendeesJson: JSON.stringify(Array.isArray(body.attendees) ? body.attendees : []),
      transcript: body.transcript ?? "",
      summary: body.summary ?? "",
      extractionStatus: "pending",
      source: body.source?.trim() || "fathom_webhook",
    },
  });

  await logActivity({
    clientAccountId,
    action: "fathom.webhook_ingest",
    entityType: "fathom_call",
    entityId: row.id,
    details: { title },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
