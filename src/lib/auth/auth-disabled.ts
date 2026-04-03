import type { Session } from "next-auth";

import {
  isGoogleOAuthConfigured,
  isNextProductionBuild,
} from "@/src/lib/auth/auth-env";

function envTruthy(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1";
}

/**
 * When enabled, middleware skips Auth.js and `auth()` returns a fixed admin session
 * so the app works without Google OAuth.
 *
 * - Explicit: AUTH_DISABLED=true or OPEN_APP_LOGIN=true
 * - Implicit (Vercel): production runtime, Google OAuth env not set — open app until you add AUTH_GOOGLE_*.
 * - Lock the app: set both Google vars; optional REQUIRE_GOOGLE_AUTH=true disables implicit bypass
 *   if you ever need Google keys present but not ready for gatekeeping.
 */
export function isAuthDisabled(): boolean {
  if (envTruthy("AUTH_DISABLED") || envTruthy("OPEN_APP_LOGIN")) return true;
  if (envTruthy("REQUIRE_GOOGLE_AUTH")) return false;
  if (
    process.env.NODE_ENV === "production" &&
    !isNextProductionBuild() &&
    !isGoogleOAuthConfigured()
  ) {
    return true;
  }
  return false;
}

export function disabledAuthSession(): Session {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    expires,
    user: {
      id: "auth-disabled-dev",
      name: "Dev (login off)",
      email: "dev@local.invalid",
      image: null,
      role: "admin",
      clientAccountId: null,
      status: "active",
    },
  };
}
