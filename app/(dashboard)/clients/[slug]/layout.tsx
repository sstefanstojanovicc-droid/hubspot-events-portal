import { requireClientWorkspaceBySlug } from "@/src/lib/auth/client-workspace";

export default async function ClientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireClientWorkspaceBySlug(slug);
  return <>{children}</>;
}
