import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";

import {
  disabledAuthSession,
  isAuthDisabled,
} from "@/src/lib/auth/auth-disabled";
import {
  isGoogleOAuthConfigured,
  logAuthEnvSummaryOnce,
  resolveAuthSecret,
} from "@/src/lib/auth/auth-env";
import { prisma } from "@/src/lib/prisma";
import { DEV_VIEW_COOKIE } from "@/src/lib/platform/dev-view-constants";
import type { AppUserRole, AppUserStatus } from "@/src/types/auth";

logAuthEnvSummaryOnce();

const authSecret = resolveAuthSecret();

if (process.env.NODE_ENV === "production" && !isGoogleOAuthConfigured()) {
  console.error(
    "[auth] Google OAuth will not work until AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set.",
  );
}

const providers = isGoogleOAuthConfigured()
  ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        allowDangerousEmailAccountLinking: true,
      }),
    ]
  : [];

function normalizeEmail(e: string | null | undefined) {
  return e?.trim().toLowerCase() ?? "";
}

function isAdminRoleStr(role: string): boolean {
  return role === "admin" || role === "client_admin";
}

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/auth/signin" },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(error) {
      const err = error as Error & { type?: string };
      const type =
        typeof err?.type === "string" ? err.type : err?.name ?? "Error";
      console.error(`[auth] ${type}:`, err?.message ?? error);
    },
  },
  providers,
  callbacks: {
    authorized({ request, auth: session }) {
      const path = request.nextUrl.pathname;
      if (
        path.startsWith("/auth") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/_next")
      ) {
        return true;
      }
      if (!session?.user?.id) {
        return false;
      }
      const role = session.user.role as string;
      if (path.startsWith("/admin") || path === "/dashboard") {
        if (!isAdminRoleStr(role)) {
          return NextResponse.redirect(new URL("/portal", request.nextUrl));
        }
      }
      const mode = request.cookies.get(DEV_VIEW_COOKIE)?.value ?? "admin";
      if (mode === "client" && (path.startsWith("/admin") || path === "/dashboard")) {
        if (isAdminRoleStr(role)) {
          return NextResponse.redirect(new URL("/portal", request.nextUrl));
        }
      }
      return true;
    },
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") {
        return "/auth/signin?error=AccessDenied";
      }
      const email = normalizeEmail(
        (profile as { email?: string } | undefined)?.email ?? user.email,
      );
      if (!email) {
        return "/auth/signin?error=AccessDenied";
      }

      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) {
        if (dbUser.status === "disabled") {
          return "/auth/signin?error=AccessDenied";
        }
        return true;
      }

      const invite = await prisma.invite.findUnique({ where: { email } });
      if (invite && !invite.consumedAt) {
        return true;
      }

      return "/auth/signin?error=AccessDenied";
    },
    async jwt({ token, user }) {
      const id = user?.id ?? token.sub;
      if (!id || typeof id !== "string") {
        return token;
      }

      const u = await prisma.user.findUnique({ where: { id } });
      if (!u || u.status === "disabled") {
        return { ...token, sub: undefined, exp: 0 };
      }

      token.sub = u.id;
      token.role = u.role;
      token.clientAccountId = u.clientAccountId;
      token.status = u.status;
      token.name = u.name;
      token.email = u.email;
      token.picture = u.image;
      return token;
    },
    async session({ session, token }) {
      if (!token.sub || !session.user) {
        return session;
      }
      session.user.id = token.sub;
      session.user.role = (token.role as AppUserRole) ?? "client_user";
      session.user.clientAccountId = (token.clientAccountId as string | null) ?? null;
      session.user.status = (token.status as AppUserStatus) ?? "invited";
      if (token.name) {
        session.user.name = token.name as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      if (token.picture) {
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const email = normalizeEmail(user.email);
      const invite = await prisma.invite.findUnique({ where: { email } });
      if (invite && !invite.consumedAt) {
        await prisma.user.update({
          where: { id: user.id! },
          data: {
            role: invite.role,
            clientAccountId: invite.clientAccountId,
            status: "active",
          },
        });
        await prisma.invite.update({
          where: { id: invite.id },
          data: { consumedAt: new Date() },
        });
      }
    },
    async linkAccount({ user }) {
      await prisma.user.updateMany({
        where: { id: user.id, status: "invited" },
        data: { status: "active" },
      });
    },
  },
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

/** Use in middleware.ts when login is enabled. */
export const authMiddleware = nextAuth.auth;

export const auth = (async (...args: unknown[]) => {
  if (isAuthDisabled() && args.length === 0) {
    return disabledAuthSession();
  }
  return (
    nextAuth.auth as (...a: unknown[]) => ReturnType<typeof nextAuth.auth>
  )(...args);
}) as typeof nextAuth.auth;
