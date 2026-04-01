import type { Session } from "next-auth";

/**
 * When AUTH_DISABLED=true, middleware skips Auth.js and `auth()` returns a fixed
 * dev session so the dashboard works without Google OAuth. Re-enable later by
 * unsetting the env var and restoring normal middleware.
 */
export function isAuthDisabled(): boolean {
  const v = process.env.AUTH_DISABLED?.trim().toLowerCase();
  return v === "true" || v === "1";
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
