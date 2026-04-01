import { ClientAccountList } from "@/src/components/platform/client-account-list";
import { clientAccounts } from "@/src/lib/platform/mock-data";

export default function AdminClientsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold">Client Accounts</h2>
        <p className="mt-2 text-sm text-slate-600">
          Development tenant for HubSpot portal 46168086.
        </p>
      </header>

      <ClientAccountList clients={clientAccounts} />
    </div>
  );
}
