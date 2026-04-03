"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";

import { generateRenewalWritePlan } from "@/src/lib/hubspot-ai/actions/write-plans";

export function HubspotAiPlanToolbar({
  slug,
  threadId,
}: {
  slug: string;
  threadId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await generateRenewalWritePlan(slug, threadId);
            router.refresh();
          })
        }
        className="rounded-md bg-hub-ink px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-40"
      >
        {pending ? "Generating…" : "Generate renewal write plan"}
      </button>
      <Link
        href={`/clients/${slug}/hubspot-ai/plans`}
        className="font-semibold text-hub-ink hover:underline"
      >
        View plans
      </Link>
    </div>
  );
}
