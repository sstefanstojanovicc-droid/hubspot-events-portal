import { SearchBoardSubnav } from "@/src/components/search-board/search-board-subnav";
import { getDevImpersonateClientId } from "@/src/lib/platform/dev-view-cookies";

export default async function SearchBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientId = await getDevImpersonateClientId();
  return (
    <div className="mx-auto max-w-6xl">
      <SearchBoardSubnav clientId={clientId} />
      {children}
    </div>
  );
}
