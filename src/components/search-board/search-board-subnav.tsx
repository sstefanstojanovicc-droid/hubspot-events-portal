"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SearchBoardSubnav({ clientId }: { clientId: string }) {
  const path = usePathname();
  const tab = (href: string, label: string) => {
    const on = path === href || (href !== "/apps/search-board" && path.startsWith(href));
    return (
      <Link
        href={href}
        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          on ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/80 p-1">
      {tab("/apps/search-board", "Dashboard")}
      {tab("/apps/search-board/shortlists", "Shortlists")}
      <Link
        href={`/admin/clients/${clientId}/apps/search-board/install`}
        className="ml-auto rounded-md px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        Install / mapping
      </Link>
    </nav>
  );
}
