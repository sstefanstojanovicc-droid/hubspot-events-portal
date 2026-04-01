import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DEV_VIEW_COOKIE } from "@/src/lib/platform/dev-view-constants";

export function middleware(request: NextRequest) {
  const mode = request.cookies.get(DEV_VIEW_COOKIE)?.value ?? "admin";
  const { pathname } = request.nextUrl;

  if (mode === "client") {
    if (pathname.startsWith("/admin") || pathname === "/dashboard") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard"],
};
