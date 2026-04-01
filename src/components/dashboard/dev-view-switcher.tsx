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
      <button
        type="button"
        disabled={isPending || mode === "admin"}
        onClick={() => startTransition(() => setDevPlatformViewAction("admin"))}
        className={`rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
          mode === "admin" ? "bg-hub text-white" : "bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        Admin
      </button>
      <button
        type="button"
        disabled={isPending || mode === "client"}
        onClick={() => startTransition(() => setDevPlatformViewAction("client"))}
        className={`rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
          mode === "client" ? "bg-hub text-white" : "bg-white/10 text-white hover:bg-white/20"
        }`}
        title={clientLabel ?? undefined}
      >
        Client
      </button>
      {isPending ? <span className="text-xs text-slate-400">…</span> : null}
    </div>
  );
}
