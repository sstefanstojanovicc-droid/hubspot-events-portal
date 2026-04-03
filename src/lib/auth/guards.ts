import "server-only";

import { auth } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import type { AppUserRole } from "@/src/types/auth";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  return session;
}

/** Legacy name: platform operators only (not tenant `client_admin`). */
export async function requireAdmin(): Promise<Session> {
  return requirePlatformAdmin();
}

/** Full platform access: manage all clients, branding, installs, library. */
export async function requirePlatformAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

export function assertClientAccountAccess(session: Session, clientAccountId: string): void {
  const role = session.user.role as AppUserRole;
  if (role === "admin") {
    return;
  }
  if (
    (role === "client_admin" || role === "client_user") &&
    session.user.clientAccountId === clientAccountId
  ) {
    return;
  }
  redirect("/dashboard");
}

export function isAdminRole(role: AppUserRole): boolean {
  return role === "admin" || role === "client_admin";
}
