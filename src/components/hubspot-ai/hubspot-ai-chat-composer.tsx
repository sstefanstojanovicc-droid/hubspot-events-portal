"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sendHubspotAiChatMessage } from "@/src/lib/hubspot-ai/actions/chat";

export function HubspotAiChatComposer({
  slug,
  threadId,
}: {
  slug: string;
  threadId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    const v = text.trim();
    if (!v || pending) return;
    startTransition(async () => {
      await sendHubspotAiChatMessage(slug, threadId, v);
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 border-t border-slate-200 pt-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        rows={3}
        placeholder="Ask about a renewal system or describe a HubSpot build…"
        className="min-w-0 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-hub-ink focus:outline-none focus:ring-1 focus:ring-hub-ink"
      />
      <button
        type="button"
        onClick={send}
        disabled={pending || !text.trim()}
        className="h-fit shrink-0 self-end rounded-lg bg-hub-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
      >
        {pending ? "…" : "Send"}
      </button>
    </div>
  );
}
