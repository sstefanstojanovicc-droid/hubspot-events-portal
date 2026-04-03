import Link from "next/link";

import { AddClientAccountForm } from "@/src/components/admin/add-client-account-form";
import { ClientAccountList } from "@/src/components/platform/client-account-list";
import { listClientAccounts } from "@/src/lib/platform/client-accounts-repo";

export default async function AdminClientsPage() {
  const clients = await listClientAccounts();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-hub-bar">Client accounts</h2>
          <p className="mt-2 text-sm text-slate-600">
            Manage tenants and HubSpot portals. Open the dashboard for platform-wide stats.
          </p>
          <p className="mt-2 text-sm">
            <Link href="/dashboard" className="font-medium text-hub hover:text-hub-hover hover:underline">
              ← Dashboard
            </Link>
          </p>
        </div>
        <div className="w-full max-w-sm sm:shrink-0">
          <AddClientAccountForm />
        </div>
      </header>

      <ClientAccountList clients={clients} />
    </div>
  );
}
