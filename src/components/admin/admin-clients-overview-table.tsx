import Link from "next/link";

import type { AdminClientOverviewRow } from "@/src/lib/platform/admin-clients-overview";

function searchBoardLabel(s: AdminClientOverviewRow["searchBoard"]): string {
  switch (s) {
    case "live":
      return "Live";
    case "needs_mapping":
      return "Needs setup";
    case "no_token":
      return "No token";
    case "hubspot_error":
      return "HubSpot error";
    default:
      return "—";
  }
}

function searchBoardTone(s: AdminClientOverviewRow["searchBoard"]): string {
  switch (s) {
    case "live":
      return "text-emerald-800 bg-emerald-50 border-emerald-200";
    case "needs_mapping":
      return "text-amber-900 bg-amber-50 border-amber-200";
    case "no_token":
      return "text-slate-600 bg-slate-50 border-slate-200";
    case "hubspot_error":
      return "text-rose-900 bg-rose-50 border-rose-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

export function AdminClientsOverviewTable({ rows }: { rows: AdminClientOverviewRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        No client accounts yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Client</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Portal ID</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">HubSpot</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Search Board</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700">Shortlists</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700">Candidates</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row) => (
            <tr key={row.client.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <p className="font-medium text-hub-bar">{row.client.name}</p>
                <p className="text-xs text-slate-500">{row.client.slug}</p>
              </td>
              <td className="px-4 py-3 font-mono text-slate-700">{row.client.hubspotPortalId}</td>
              <td className="px-4 py-3 text-slate-700 capitalize">
                {row.hubspotConnection.replaceAll("_", " ")}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${searchBoardTone(row.searchBoard)}`}
                >
                  {searchBoardLabel(row.searchBoard)}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                {row.shortlistCount === null ? "—" : row.shortlistCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                {row.candidateCount === null ? "—" : row.candidateCount}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/clients/${row.client.id}`}
                  className="font-medium text-hub hover:text-hub-hover hover:underline"
                >
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
