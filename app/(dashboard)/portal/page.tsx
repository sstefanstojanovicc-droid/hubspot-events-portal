import { redirect } from "next/navigation";

import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";
import { getClientAccountById } from "@/src/lib/platform/client-accounts-repo";

export default async function ClientPortalPage() {
  const clientId = await getWorkspaceClientId();
  const client = await getClientAccountById(clientId);

  if (!client) {
    return (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Client home</h2>
        <p className="text-sm text-slate-600">Unknown workspace client id.</p>
      </div>
    );
  }

  redirect(`/clients/${client.slug}`);
}
