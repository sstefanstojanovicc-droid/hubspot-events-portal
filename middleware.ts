import { NextResponse } from "next/server";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";

import { authMiddleware } from "@/auth";
import { isAuthDisabled } from "@/src/lib/auth/auth-disabled";

const runAuthMiddleware = authMiddleware as unknown as NextMiddleware;

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isAuthDisabled()) {
    const url = req.nextUrl;
    if (url.pathname === "/auth/signin" || url.pathname.startsWith("/auth/signin/")) {
      const cb = url.searchParams.get("callbackUrl");
      let target = "/dashboard";
      if (cb?.startsWith("/") && !cb.startsWith("//")) {
        target = cb.split("?")[0] || "/dashboard";
      }
      return NextResponse.redirect(new URL(target, url));
    }
    return NextResponse.next();
  }
  return runAuthMiddleware(req, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
