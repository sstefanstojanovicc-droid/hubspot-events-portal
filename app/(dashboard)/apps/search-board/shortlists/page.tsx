import Link from "next/link";
import { ShortlistsIndexClient } from "@/src/components/search-board/shortlists-index-client";
import { EmptyState } from "@/src/components/search-board/primitives";
import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import {
  buildShortlistEntryCounts,
  listShortlists,
  resolveSearchBoardTenant,
} from "@/src/lib/search-board/data";

export default async function SearchBoardShortlistsPage() {
  const clientId = await getWorkspaceClientId();
  const gate = await resolveSearchBoardTenant(clientId);

  if (!gate.ok) {
    const err = gate.error;
    const msg =
      err.code === "no_token"
        ? "HubSpot API token is not configured."
        : err.code === "no_mapping" || err.code === "incomplete_mapping"
          ? err.code === "incomplete_mapping"
            ? err.detail
            : "One-time HubSpot setup is required for this portal."
          : err.message;
    return (
      <EmptyState
        title="Shortlists"
        description={msg}
        action={
          <Link
            href={`/admin/clients/${clientId}/apps/search-board/install`}
            className="rounded-lg bg-hub px-4 py-2 text-sm font-semibold text-white hover:bg-hub-hover"
          >
            Setup
          </Link>
        }
      />
    );
  }

  const [lists, counts] = await Promise.all([
    listShortlists(clientId),
    buildShortlistEntryCounts(clientId),
  ]);

  if (!lists.ok) {
    return (
      <EmptyState
        title="Could not load shortlists"
        description={lists.error.code === "hubspot" ? lists.error.message : "HubSpot error"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Shortlists</h1>
        <p className="mt-1 text-sm text-slate-600">
          Client searches and role boards. Open a shortlist to work the candidate pipeline.
        </p>
      </div>

      <ShortlistsIndexClient shortlists={lists.shortlists} entryCounts={counts} />
    </div>
  );
}
