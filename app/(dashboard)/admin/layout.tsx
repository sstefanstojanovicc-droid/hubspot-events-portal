import { requireAdmin } from "@/src/lib/auth/guards";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return children;
}
