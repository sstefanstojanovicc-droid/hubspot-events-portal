import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { getClientAppMapping } from "@/src/lib/platform/client-app-mapping-store";
import {
  listCandidates,
  listShortlists,
  resolveSearchBoardTenant,
} from "@/src/lib/search-board/data";

type PageProps = { params: Promise<{ slug: string }> };

export default async function HubSpotObjectsPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const gate = await resolveSearchBoardTenant(client.id);
  const mapping = getClientAppMapping(client.id, "search_board");

  let shortlistCount: number | null = null;
  let candidateCount: number | null = null;
  if (gate.ok) {
    const [sl, c] = await Promise.all([listShortlists(client.id), listCandidates(client.id)]);
    shortlistCount = sl.ok ? sl.shortlists.length : null;
    candidateCount = c.ok ? c.candidates.length : null;
  }

  const objects: Array<{
    label: string;
    typeId: string;
    count: number | null;
    note?: string;
  }> = gate.ok
    ? [
        {
          label: "Candidate",
          typeId: gate.tenant.candidateTypeId,
          count: candidateCount,
        },
        {
          label: "Shortlist",
          typeId: gate.tenant.shortlistTypeId,
          count: shortlistCount,
        },
        {
          label: "Shortlist entry",
          typeId: gate.tenant.entryTypeId,
          count: null,
          note: "Counted via shortlist board load (not aggregated here).",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-hub-bar">Objects</h2>
        <p className="mt-2 text-sm text-slate-600">
          Custom Search Board CRM types for this portal. Standard objects (contacts, companies) will
          join the same layer in a later iteration.
        </p>
      </div>

      {!gate.ok ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Mapping not available.{" "}
          <Link
            href={`/admin/clients/${client.id}/apps/search-board/install`}
            className="font-semibold underline"
          >
            Run Search Board setup
          </Link>{" "}
          to resolve object type IDs.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Object</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Type ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Records (approx.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {objects.map((row) => (
                <tr key={row.typeId}>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.typeId}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.count != null ? row.count : row.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mapping?.lastInstallReport ? (
        <p className="text-xs text-slate-500">
          Last install report:{" "}
          {mapping.lastInstallReport.ok
            ? "OK"
            : `Error — ${mapping.lastInstallReport.hubspotMessage ?? mapping.lastInstallReport.failedStep ?? ""}`}
        </p>
      ) : null}
    </div>
  );
}
