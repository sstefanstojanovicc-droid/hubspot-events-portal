"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  const hint =
    /prisma|database|P1001|P1017/i.test(error.message) ||
    /prisma|database/i.test(String(error.cause ?? ""))
      ? "This usually means DATABASE_URL is missing or the database is unreachable on Vercel. Use a hosted Postgres URL (Vercel Postgres, Neon, etc.) and run migrations — SQLite file paths do not persist on serverless."
      : null;

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold text-hub-bar">This page couldn&apos;t load</p>
      <p className="text-sm text-slate-600">
        A server error occurred. Check Vercel → Deployment → Logs for details.
      </p>
      {hint ? <p className="text-left text-xs text-slate-500">{hint}</p> : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        Reload
      </button>
    </div>
  );
}
