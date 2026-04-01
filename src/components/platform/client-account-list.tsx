import Link from "next/link";
import type { ClientAccount } from "@/src/types/platform-tenant";

interface ClientAccountListProps {
  clients: ClientAccount[];
}

export function ClientAccountList({ clients }: ClientAccountListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Client</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Slug</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">
              HubSpot portal ID
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {clients.map((client) => (
            <tr key={client.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="font-medium text-indigo-700 hover:text-indigo-900"
                >
                  {client.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{client.slug}</td>
              <td className="px-4 py-3 text-slate-600">{client.hubspotPortalId}</td>
              <td className="px-4 py-3 text-slate-600">
                {client.connectionStatus.replaceAll("_", " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
