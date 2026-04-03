import Link from "next/link";

import { auth } from "@/auth";
import { assertClientAccountAccess } from "@/src/lib/auth/guards";
import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { listUsersForTenant } from "@/src/lib/workspace/users-repo";

type PageProps = { params: Promise<{ slug: string }> };

export default async function WorkspaceUsersPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  const session = await auth();
  if (session?.user) {
    assertClientAccountAccess(session, client.id);
  }
  const users = await listUsersForTenant(client.id);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Users</p>
        <h1 className="text-2xl font-semibold text-hub-bar">Team</h1>
        <p className="mt-1 text-sm text-slate-600">
          People with access to this workspace. Invites and role editing will connect to Auth here.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No users linked to this client account yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-800">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {u.role.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link
        href={`/clients/${client.slug}/settings`}
        className="text-sm font-semibold text-hub-ink hover:underline"
      >
        Workspace settings →
      </Link>
    </div>
  );
}
