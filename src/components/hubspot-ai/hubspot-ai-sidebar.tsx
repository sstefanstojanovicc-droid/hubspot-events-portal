"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { createHubspotAiThread } from "@/src/lib/hubspot-ai/actions/threads";
import type { ClientAccount } from "@/src/types/platform-tenant";

import { AddImplementationResourceForm } from "@/src/components/hubspot-ai/add-implementation-resource-form";

type ThreadRow = { id: string; title: string; updatedAt: Date };
type ResourceRow = {
  id: string;
  type: string;
  title: string;
  url: string | null;
};

const linkBase =
  "block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100";
const linkActive = "bg-slate-100 font-medium text-hub-ink";

export function HubspotAiSidebar({
  client,
  threads,
  resources,
}: {
  client: ClientAccount;
  threads: ThreadRow[];
  resources: ResourceRow[];
}) {
  const pathname = usePathname();
  const activeThreadId = /\/thread\/([^/]+)/.exec(pathname ?? "")?.[1];
  const slug = client.slug;
  const base = `/clients/${slug}/hubspot-ai`;

  return (
    <aside className="w-full shrink-0 space-y-6 border-b border-slate-200 pb-6 lg:w-64 lg:border-b-0 lg:border-r lg:pr-5 lg:pb-0">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Threads
        </p>
        <ul className="mt-2 space-y-0.5">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`${base}/thread/${t.id}`}
                className={`${linkBase} ${activeThreadId === t.id ? linkActive : ""}`}
              >
                {t.title}
              </Link>
            </li>
          ))}
        </ul>
        <form action={createHubspotAiThread}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="title" value="New implementation thread" />
          <button
            type="submit"
            className="mt-3 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-sm font-medium text-hub-ink hover:bg-slate-50"
          >
            + New thread
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Project resources
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          SOW, notes, Miro, company site — used to ground the assistant.
        </p>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
          {resources.length === 0 ? (
            <li className="text-slate-500">None yet — add below.</li>
          ) : (
            resources.map((r) => (
              <li key={r.id} className="truncate text-slate-700">
                <span className="text-xs uppercase text-slate-400">{r.type}</span>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 font-medium text-hub-ink hover:underline"
                  >
                    {r.title}
                  </a>
                ) : (
                  <span className="ml-1">{r.title}</span>
                )}
              </li>
            ))
          )}
        </ul>
        <div className="mt-3">
          <AddImplementationResourceForm slug={slug} />
        </div>
      </div>

      <div>
        <Link
          href={`${base}/plans`}
          className="text-sm font-semibold text-hub-ink hover:underline"
        >
          Write plans →
        </Link>
      </div>
    </aside>
  );
}
