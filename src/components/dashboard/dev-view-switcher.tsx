"use client";

import { useTransition } from "react";

import { setDevPlatformViewAction } from "@/src/lib/platform/actions/dev-view";
import type { DevPlatformView } from "@/src/lib/platform/dev-view-cookies";

interface DevViewSwitcherProps {
  mode: DevPlatformView;
  clientLabel?: string;
}

export function DevViewSwitcher({ mode, clientLabel }: DevViewSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-300">Switch view:</span>
      <button
        type="button"
        disabled={isPending || mode === "admin"}
        onClick={() => startTransition(() => setDevPlatformViewAction("admin"))}
        className="rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
      >
        Admin
      </button>
      <button
        type="button"
        disabled={isPending || mode === "client"}
        onClick={() => startTransition(() => setDevPlatformViewAction("client"))}
        className="rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
        title={clientLabel ? `Impersonate ${clientLabel}` : undefined}
      >
        Client
      </button>
      {isPending ? <span className="text-xs text-slate-400">…</span> : null}
    </div>
  );
}
