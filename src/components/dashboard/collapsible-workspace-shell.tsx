"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";

import { SidebarCollapsedContext } from "@/src/components/dashboard/sidebar-collapse-context";

const STORAGE_KEY = "hub_workspace_sidebar_collapsed";

export type ShellNavItem = {
  href: string;
  label: string;
};

export function CollapsibleWorkspaceShell({
  brandTitle,
  logoEl,
  navItems,
  navContent,
  appShortcutLabel,
  appShortcutItems,
  children,
  topBar,
}: {
  brandTitle: string;
  logoEl: ReactNode;
  /** Simple flat list (e.g. client workspace). Ignored when `navContent` is set. */
  navItems?: ShellNavItem[];
  /** Full admin navigation (replaces `navItems` when set). */
  navContent?: ReactNode;
  appShortcutLabel?: string;
  appShortcutItems?: ShellNavItem[];
  children: ReactNode;
  topBar: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const linkClass = collapsed
    ? "flex items-center justify-center rounded-md p-2.5 text-slate-600 transition hover:bg-hub-muted hover:text-hub-ink"
    : "block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-hub-muted hover:text-hub-ink";

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <Fragment key="shell-topbar">{topBar}</Fragment>
      <div className="mx-auto flex w-full max-w-[1920px] gap-0 px-3 py-4 sm:px-4 lg:px-5">
        <aside
          className={`shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-black/[0.03] transition-[width] duration-200 ease-out ${
            mounted && collapsed ? "w-[3.25rem]" : "w-52 sm:w-56"
          }`}
        >
          <div className="border-b border-slate-100 bg-gradient-to-b from-white to-hub-muted/25 px-2 py-3 sm:px-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
              >
                <span className="sr-only">{collapsed ? "Expand" : "Collapse"} sidebar</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {collapsed ? (
                    <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" d="M15 5l-7 7 7 7" />
                  )}
                </svg>
              </button>
              {!collapsed ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {logoEl}
                  <h1 className="truncate text-[13px] font-semibold leading-tight text-hub-bar">
                    {brandTitle}
                  </h1>
                </div>
              ) : (
                <div className="flex flex-1 justify-center">{logoEl}</div>
              )}
            </div>
          </div>

          <SidebarCollapsedContext.Provider value={mounted && collapsed}>
            <nav className="space-y-0.5 p-2">
              {navContent ? (
                <Fragment key="shell-nav-custom">{navContent}</Fragment>
              ) : (
                <Fragment key="shell-nav-default">
                  {(navItems ?? []).map((item) => (
                    <Link
                      key={`${item.href}::${item.label}`}
                      href={item.href}
                      className={linkClass}
                      title={collapsed ? item.label : undefined}
                    >
                      {collapsed ? (
                        <span className="text-xs font-bold text-hub-bar">{item.label.charAt(0)}</span>
                      ) : (
                        item.label
                      )}
                    </Link>
                  ))}
                  {appShortcutItems && appShortcutItems.length > 0 ? (
                    <>
                      {!collapsed ? (
                        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {appShortcutLabel ?? "Apps"}
                        </p>
                      ) : (
                        <div className="my-2 border-t border-slate-100" />
                      )}
                      {appShortcutItems.map((item) => (
                        <Link
                          key={`${item.href}::${item.label}`}
                          href={item.href}
                          className={linkClass}
                          title={collapsed ? item.label : undefined}
                        >
                          {collapsed ? (
                            <span className="text-xs font-bold text-slate-500">{item.label.charAt(0)}</span>
                          ) : (
                            item.label
                          )}
                        </Link>
                      ))}
                    </>
                  ) : null}
                </Fragment>
              )}
            </nav>
          </SidebarCollapsedContext.Provider>
        </aside>

        <main className="min-h-[80vh] min-w-0 flex-1 overflow-x-hidden pl-3 sm:pl-4 lg:pl-5">
          <div className="mx-auto w-full max-w-[min(100%,90rem)] rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
