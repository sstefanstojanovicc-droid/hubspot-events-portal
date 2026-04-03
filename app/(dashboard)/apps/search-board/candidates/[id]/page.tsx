import Link from "next/link";

import { CandidateDetailClient } from "@/src/components/search-board/candidate-detail-client";
import { EmptyState } from "@/src/components/search-board/primitives";
import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import { getClientAccountById } from "@/src/lib/platform/client-accounts-repo";
import {
  getCandidateById,
  listCandidateShortlistMemberships,
  resolveSearchBoardTenant,
} from "@/src/lib/search-board/data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateDetailPage({ params }: PageProps) {
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
        title="Candidate"
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

  const [cand, mem, account] = await Promise.all([
    getCandidateById(clientId, id),
    listCandidateShortlistMemberships(clientId, id),
    getClientAccountById(clientId),
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
        <Link href="/apps/search-board" className="font-medium text-hub-ink hover:text-hub-bar">
          Dashboard
        </Link>
        <Link
          href="/apps/search-board/shortlists"
          className="font-medium text-hub-ink hover:text-hub-bar"
        >
          Shortlists
        </Link>
      </nav>
      <CandidateDetailClient
        clientId={clientId}
        candidate={cand.candidate}
        memberships={mem.rows}
        hubspotPortalId={account?.hubspotPortalId ?? ""}
        candidateObjectTypeId={gate.tenant.candidateTypeId}
        shortlistObjectTypeId={gate.tenant.shortlistTypeId}
        entryObjectTypeId={gate.tenant.entryTypeId}
      />
    </div>
  );
}
