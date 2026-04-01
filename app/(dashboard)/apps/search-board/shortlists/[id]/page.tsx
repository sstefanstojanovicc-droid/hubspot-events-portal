import Link from "next/link";

import { ShortlistWorkspace } from "@/src/components/search-board/shortlist-workspace";
import { EmptyState } from "@/src/components/search-board/primitives";
import { getDevImpersonateClientId } from "@/src/lib/platform/dev-view-cookies";
import {
  getSearchBoardTenantObjects,
  listCandidates,
  loadShortlistBoardData,
} from "@/src/lib/search-board/data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShortlistDetailPage({ params }: PageProps) {
  const { id } = await params;
  const clientId = await getDevImpersonateClientId();
  const gate = getSearchBoardTenantObjects(clientId);

  if (!gate.ok) {
    const err = gate.error;
    const msg =
      err.code === "no_token"
        ? "Configure HUBSPOT_ACCESS_TOKEN."
        : err.code === "no_mapping"
          ? "Complete Search Board install first."
          : err.code === "incomplete_mapping"
            ? err.detail
            : err.message;
    return (
      <EmptyState
        title="Shortlist unavailable"
        description={msg}
        action={
          <Link
            href={`/admin/clients/${clientId}/apps/search-board/install`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Install
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
        <Link href="/apps/search-board/shortlists" className="font-medium text-indigo-700 hover:text-indigo-900">
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
