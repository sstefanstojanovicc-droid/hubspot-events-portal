import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAuthDisabled } from "@/src/lib/auth/auth-disabled";
import {
  DEV_CLIENT_COOKIE,
} from "@/src/lib/platform/dev-view-constants";
import { DEFAULT_DEV_CLIENT_ID } from "@/src/lib/platform/mock-data";
import { isAdminRole } from "@/src/lib/auth/guards";

/**
 * HubSpot / Search Board tenant id for the current request.
 * - Admins: dev client cookie (impersonation) or default dev tenant.
 * - Client users: always their assigned `clientAccountId` (cookie ignored).
 */
export async function getWorkspaceClientId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    if (isAuthDisabled()) {
      const jar = await cookies();
      return jar.get(DEV_CLIENT_COOKIE)?.value ?? DEFAULT_DEV_CLIENT_ID;
    }
    redirect("/auth/signin");
  }

  if (isAdminRole(session.user.role)) {
    const jar = await cookies();
    return jar.get(DEV_CLIENT_COOKIE)?.value ?? DEFAULT_DEV_CLIENT_ID;
  }

  const id = session.user.clientAccountId;
  if (!id) {
    redirect("/portal");
  }
  return id;
}
