import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";

type PageProps = { params: Promise<{ slug: string }> };

export default async function HubSpotPipelinesPage({ params }: PageProps) {
  const { slug } = await params;
  await requireClientWorkspaceBySlug(slug);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-hub-bar">Pipelines</h2>
      <p className="text-sm text-slate-600">
        Deal and ticket pipelines, plus custom object stages, will be listed here once the sync layer
        pulls HubSpot settings. For now, manage stages in HubSpot directly.
      </p>
    </div>
  );
}
