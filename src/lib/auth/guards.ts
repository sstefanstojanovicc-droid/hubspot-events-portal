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

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "admin" && role !== "client_admin") {
    redirect("/portal");
  }
  return session;
}

export function assertClientAccountAccess(session: Session, clientAccountId: string): void {
  const role = session.user.role as AppUserRole;
  if (role === "admin" || role === "client_admin") {
    return;
  }
  if (role === "client_user" && session.user.clientAccountId === clientAccountId) {
    return;
  }
  redirect("/portal");
}

export function isAdminRole(role: AppUserRole): boolean {
  return role === "admin" || role === "client_admin";
}
