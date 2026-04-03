import { requirePlatformAdmin } from "@/src/lib/auth/guards";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();
  return children;
}
