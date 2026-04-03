"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";

const BASE = "/admin/apps/hubspot-ai-implementation";

const CLIENT_TABS = [
  { segment: "builder" as const, label: "Builder" },
  { segment: "resources" as const, label: "Resources" },
  { segment: "packages" as const, label: "Packages" },
  { segment: "versions" as const, label: "Versions" },
];

export type HubspotAiClientOption = { slug: string; name: string };

export function HubspotAiAppShell({
  children,
  clients,
}: {
  children: ReactNode;
  clients: HubspotAiClientOption[];
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const { activeClientSlug, currentTab } = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const i = parts.indexOf("hubspot-ai-implementation");
    let slug: string | null = null;
    let tab: (typeof CLIENT_TABS)[number]["segment"] = "builder";
    if (i !== -1) {
      const a = parts[i + 1];
      const b = parts[i + 2];
      if (a && a !== "knowledge-base" && b && CLIENT_TABS.some((t) => t.segment === b)) {
        slug = a;
        tab = b as (typeof CLIENT_TABS)[number]["segment"];
      }
    }
    return { activeClientSlug: slug, currentTab: tab };
  }, [pathname]);

  const onKnowledgeBase = pathname.includes("/knowledge-base");

  const slugForLinks = activeClientSlug;

  function clientHref(
    segment: (typeof CLIENT_TABS)[number]["segment"],
  ): { disabled: true } | { disabled: false; href: string } {
    if (!slugForLinks) {
      return { disabled: true };
    }
    return { disabled: false, href: `${BASE}/${slugForLinks}/${segment}` };
  }

  function onClientChange(slug: string) {
    if (!slug) {
      return;
    }
    const tab = onKnowledgeBase ? "builder" : currentTab;
    router.push(`${BASE}/${slug}/${tab}`);
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Apps</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-hub-bar">
          HubSpot AI Implementation
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Internal AI workspace scoped per client. Upload SOWs, notes, and context under{" "}
          <strong className="font-medium text-slate-800">Resources</strong>; run the assistant and publish
          packages for that account. <strong className="font-medium text-slate-800">HubSpot Knowledge Base</strong>{" "}
          is global — HubSpot rules and articles that apply to every client build.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="flex min-w-[min(100%,20rem)] flex-col gap-1 text-xs font-medium text-slate-600">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">Client account</span>
            <select
              value={activeClientSlug ?? ""}
              onChange={(e) => onClientChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {!clients.length ? (
            <p className="text-xs text-amber-700">
              Add a client under{" "}
              <Link href="/admin/clients" className="font-semibold underline">
                Clients
              </Link>{" "}
              to use this workspace.
            </p>
          ) : null}
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-px" aria-label="Implementation app">
        {CLIENT_TABS.map((tab) => {
          const link = clientHref(tab.segment);
          const active =
            !onKnowledgeBase && activeClientSlug !== null && pathname.endsWith(`/${tab.segment}`);
          if (link.disabled) {
            return (
              <span
                key={tab.segment}
                className="cursor-not-allowed rounded-t-md border border-b-0 border-transparent px-3.5 py-2 text-sm font-medium text-slate-400"
                title="Select a client account first"
              >
                {tab.label}
              </span>
            );
          }
          return (
            <Link
              key={tab.segment}
              href={link.href}
              className={`rounded-t-md border border-b-0 px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "border-slate-200 bg-white text-hub-bar shadow-sm"
                  : "-mb-px border-transparent text-slate-600 hover:bg-slate-50 hover:text-hub-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <Link
          href={`${BASE}/knowledge-base`}
          className={`rounded-t-md border border-b-0 px-3.5 py-2 text-sm font-medium transition ${
            onKnowledgeBase
              ? "border-slate-200 bg-white text-hub-bar shadow-sm"
              : "-mb-px border-transparent text-slate-600 hover:bg-slate-50 hover:text-hub-ink"
          }`}
        >
          HubSpot Knowledge Base
        </Link>
      </nav>

      <div>{children}</div>
    </div>
  );
}
