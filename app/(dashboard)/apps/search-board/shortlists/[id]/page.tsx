import Link from "next/link";

import { ShortlistWorkspace } from "@/src/components/search-board/shortlist-workspace";
import { EmptyState } from "@/src/components/search-board/primitives";
import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import {
  listCandidates,
  loadShortlistBoardData,
  resolveSearchBoardTenant,
} from "@/src/lib/search-board/data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShortlistDetailPage({ params }: PageProps) {
  const { id } = await params;
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
        title="Shortlist"
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

  const board = await loadShortlistBoardData(clientId, id);
  if (!board.ok) {
    return (
      <EmptyState
        title="Could not load shortlist"
        description={
          board.error.code === "hubspot"
            ? board.error.message
            : "Check that this shortlist exists in HubSpot."
        }
        action={
          <Link
            href="/apps/search-board/shortlists"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Back to shortlists
          </Link>
        }
      />
    );
  }

  const candRes = await listCandidates(clientId);
  const candidates = candRes.ok ? candRes.candidates : [];

  return (
    <div>
      <nav className="mb-6 text-sm">
        <Link href="/apps/search-board/shortlists" className="font-medium text-hub-ink hover:text-hub-bar">
          ← Shortlists
        </Link>
      </nav>
      <ShortlistWorkspace
        clientId={clientId}
        shortlistId={id}
        shortlist={board.shortlist}
        items={board.items}
        candidates={candidates}
      />
    </div>
  );
}
