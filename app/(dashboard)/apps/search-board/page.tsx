import Link from "next/link";
import { CreateCandidateModal } from "@/src/components/search-board/create-candidate-modal";
import { EmptyState, SummaryCard } from "@/src/components/search-board/primitives";
import { getDevImpersonateClientId } from "@/src/lib/platform/dev-view-cookies";
import { getSearchBoardTenantObjects, loadDashboardStats } from "@/src/lib/search-board/data";

export default async function SearchBoardDashboardPage() {
  const clientId = await getDevImpersonateClientId();
  const gate = getSearchBoardTenantObjects(clientId);

  if (!gate.ok) {
    const err = gate.error;
    const msg =
      err.code === "no_token"
        ? "Configure HUBSPOT_ACCESS_TOKEN for your environment."
        : err.code === "no_mapping"
          ? "Run Search Board install for this client to map HubSpot object types."
          : err.code === "incomplete_mapping"
            ? err.detail
            : err.message;
    return (
      <EmptyState
        title="Search Board is not ready"
        description={msg}
        action={
          <Link
            href={`/admin/clients/${clientId}/apps/search-board/install`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Open install
          </Link>
        }
      />
    );
  }

  const stats = await loadDashboardStats(clientId);
  if (!stats.ok) {
    const e = stats.error;
    return (
      <EmptyState
        title="Could not load dashboard"
        description={e.code === "hubspot" ? e.message : "Check HubSpot connectivity."}
      />
    );
  }

  const { recentShortlists } = stats;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Search Board</h1>
        <p className="mt-1 text-sm text-slate-600">
          Executive search workspace — shortlists, candidates, and client-facing boards backed by
          HubSpot.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CreateCandidateModal clientId={clientId} />
        <Link
          href="/apps/search-board/shortlists"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          All shortlists
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Active shortlists" value={stats.activeShortlists} />
        <SummaryCard label="Candidates (total)" value={stats.totalCandidates} />
        <SummaryCard
          label="In review / interview"
          value={stats.candidatesInReview}
          hint="Entries whose board status matches your pipeline keywords."
        />
        <SummaryCard
          label="Expiring soon"
          value={stats.shortlistsExpiringSoon}
          hint="Portal expiry within 14 days."
        />
      </div>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Recent shortlist activity
          </h2>
          <Link href="/apps/search-board/shortlists" className="text-sm font-semibold text-indigo-700">
            View all
          </Link>
        </div>
        {recentShortlists.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-600">
            No shortlists yet. Create shortlist records in HubSpot, then refresh this page.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {recentShortlists.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link
                    href={`/apps/search-board/shortlists/${s.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {String(s.properties.shortlist_name ?? "Shortlist")}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {String(s.properties.client_name ?? "")} ·{" "}
                    {String(s.properties.role_title ?? "")}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {s.properties.hs_lastmodifieddate
                    ? new Date(String(s.properties.hs_lastmodifieddate)).toLocaleString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Quick links</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {recentShortlists.slice(0, 5).map((s) => (
            <li key={s.id}>
              <Link
                href={`/apps/search-board/shortlists/${s.id}`}
                className="inline-flex rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300"
              >
                {String(s.properties.shortlist_name ?? s.id)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
