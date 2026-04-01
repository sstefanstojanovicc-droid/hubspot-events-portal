import Link from "next/link";

import { CandidateDetailClient } from "@/src/components/search-board/candidate-detail-client";
import { EmptyState } from "@/src/components/search-board/primitives";
import { getDevImpersonateClientId } from "@/src/lib/platform/dev-view-cookies";
import {
  getCandidateById,
  getSearchBoardTenantObjects,
  listCandidateShortlistMemberships,
} from "@/src/lib/search-board/data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateDetailPage({ params }: PageProps) {
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
        title="Candidate profile unavailable"
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

  const [cand, mem] = await Promise.all([
    getCandidateById(clientId, id),
    listCandidateShortlistMemberships(clientId, id),
  ]);

  if (!cand.ok) {
    return (
      <EmptyState
        title="Candidate not found"
        description={
          cand.error.code === "hubspot"
            ? cand.error.message
            : "This record may have been removed from HubSpot."
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

  if (!mem.ok) {
    return (
      <EmptyState
        title="Could not load memberships"
        description={mem.error.code === "hubspot" ? mem.error.message : "HubSpot error"}
      />
    );
  }

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-4 text-sm">
        <Link href="/apps/search-board" className="font-medium text-indigo-700 hover:text-indigo-900">
          Dashboard
        </Link>
        <Link
          href="/apps/search-board/shortlists"
          className="font-medium text-indigo-700 hover:text-indigo-900"
        >
          Shortlists
        </Link>
      </nav>
      <CandidateDetailClient clientId={clientId} candidate={cand.candidate} memberships={mem.rows} />
    </div>
  );
}
