import { SearchBoardSubnav } from "@/src/components/search-board/search-board-subnav";
import { isAdminRole, requireSession } from "@/src/lib/auth/guards";
import { getWorkspaceClientId } from "@/src/lib/auth/workspace-context";

export default async function SearchBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientId = await getWorkspaceClientId();
  const session = await requireSession();
  const role = session.user.role;
  const showSetup = role != null && isAdminRole(role);

  return (
    <div className="mx-auto max-w-6xl">
      <SearchBoardSubnav clientId={clientId} showSetupLink={showSetup} />
      {children}
    </div>
  );
}
