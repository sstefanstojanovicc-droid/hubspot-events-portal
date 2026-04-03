"use client";

import { useEffect, useState } from "react";

type Props = {
  chart: string;
  className?: string;
  /** Default dark (AI builder). Use `light` on light admin surfaces. */
  variant?: "dark" | "light";
};

/** Renders Mermaid in the browser. */
export function ImplementationMermaid({ chart, className = "", variant = "dark" }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart.trim()) {
      setSvg(null);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setError(null);
      try {
        const mermaid = (await import("mermaid")).default;
        const isLight = variant === "light";
        mermaid.initialize({
          startOnLoad: false,
          theme: isLight ? "neutral" : "dark",
          securityLevel: "loose",
          themeVariables: isLight
            ? {
                primaryColor: "#f1f5f9",
                primaryTextColor: "#334155",
                primaryBorderColor: "#cbd5e1",
                lineColor: "#64748b",
                secondaryColor: "#e2e8f0",
                tertiaryColor: "#f8fafc",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
              }
            : {
                primaryColor: "#27272a",
                primaryTextColor: "#e4e4e7",
                primaryBorderColor: "#52525b",
                lineColor: "#a1a1aa",
                secondaryColor: "#18181b",
                tertiaryColor: "#3f3f46",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
              },
        });
        const id = `mmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg: out } = await mermaid.render(id, chart.trim());
        if (!cancelled) {
          setSvg(out);
        }
      } catch (e) {
        if (!cancelled) {
          setSvg(null);
          setError(e instanceof Error ? e.message : "Could not render diagram");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, variant]);

  if (!chart.trim()) {
    return (
      <p className={`text-xs ${variant === "light" ? "text-slate-500" : "text-zinc-500"}`}>
        No flowchart in this version.
      </p>
    );
  }

  if (error) {
    const errBox =
      variant === "light"
        ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
        : "rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300";
    const preCls =
      variant === "light"
        ? "mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-slate-600"
        : "mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-zinc-400";
    return (
      <div className={errBox}>
        <span className="font-medium">Diagram:</span> {error}
        <pre className={preCls}>{chart.slice(0, 800)}</pre>
      </div>
    );
  }

  if (!svg) {
    const pulse =
      variant === "light"
        ? "animate-pulse rounded-lg bg-slate-100 py-12 text-center text-xs text-slate-500"
        : "animate-pulse rounded-lg bg-zinc-900/80 py-12 text-center text-xs text-zinc-500";
    return <div className={pulse}>Rendering…</div>;
  }

  const frame =
    variant === "light"
      ? "implementation-mermaid overflow-x-auto rounded-lg border border-slate-200 bg-white p-4"
      : "implementation-mermaid overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4";
  return (
    <div className={`${frame} ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
