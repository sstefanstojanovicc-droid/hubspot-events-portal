import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";
import { ClientWorkspaceDashboard } from "@/src/components/clients/client-workspace-dashboard";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientWorkspaceHomePage({ params }: PageProps) {
  const { slug } = await params;
  const client = await requireClientWorkspaceBySlug(slug);
  return <ClientWorkspaceDashboard client={client} />;
}
