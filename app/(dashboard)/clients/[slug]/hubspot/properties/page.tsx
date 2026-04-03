import Link from "next/link";

import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { resolveSearchBoardTenant } from "@/src/lib/search-board/data";

const CANDIDATE_PROPS = [
  "candidate_name",
  "current_title",
  "summary",
  "location",
  "gender",
  "status",
];
const SHORTLIST_PROPS = [
  "shortlist_name",
  "client_name",
  "role_title",
  "consultant_name",
  "status",
  "portal_link",
  "portal_expiry",
  "internal_notes",
];
const ENTRY_PROPS = ["rank", "shortlist_status", "client_feedback", "internal_notes", "entry_name"];

type PageProps = { params: Promise<{ slug: string }> };

export default async function HubSpotPropertiesPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const gate = await resolveSearchBoardTenant(client.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-hub-bar">Properties</h2>
        <p className="mt-2 text-sm text-slate-600">
          Blueprint properties used by Search Board sync. Full schema diff vs portal is planned for
          the HubSpot data layer.
        </p>
      </div>

      {!gate.ok ? (
        <p className="text-sm text-amber-800">
          <Link href={`/admin/clients/${client.id}/apps/search-board/install`} className="underline">
            Complete mapping
          </Link>{" "}
          to enable live property introspection.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <PropCard title="Candidate" props={CANDIDATE_PROPS} />
          <PropCard title="Shortlist" props={SHORTLIST_PROPS} />
          <PropCard title="Shortlist entry" props={ENTRY_PROPS} />
        </div>
      )}
    </div>
  );
}

function PropCard({ title, props }: { title: string; props: string[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 list-inside list-disc text-xs text-slate-600">
        {props.map((p) => (
          <li key={p} className="font-mono">
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}
