/**
 * Central place for auth-related env validation and dev-safe defaults.
 * Never log secret values — only names and presence.
 */

const DEV_AUTH_SECRET_PLACEHOLDER =
  "local-dev-only-do-not-use-in-production-min-32-chars!!";

/**
 * True while a production build is running (compile + "Collecting page data", etc.).
 * Vercel often does not set `NEXT_PHASE` during page-data collection, but `npm run build`
 * sets `npm_lifecycle_event=build`, so we treat that as build-time too.
 */
export function isNextProductionBuild(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return true;
  }
  if (process.env.npm_lifecycle_event === "build") {
    return true;
  }
  const script = process.env.npm_lifecycle_script ?? "";
  if (/\bnext\s+build\b/.test(script)) {
    return true;
  }
  return false;
}

/**
 * Placeholder so `next build` can complete when secrets are runtime-only on the host.
 * Never use for real sessions — real AUTH_SECRET is required at runtime.
 */
const PRODUCTION_BUILD_AUTH_SECRET_PLACEHOLDER =
  "build-time-only-placeholder-auth-secret-min-40-chars-x";

let loggedEnvSummary = false;

export function resolveAuthSecret(): string {
  const fromEnv = (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    ""
  ).trim();

  if (fromEnv.length > 0) {
    if (fromEnv.length < 32 && process.env.NODE_ENV === "production") {
      if (isNextProductionBuild()) {
        console.warn(
          "[auth] AUTH_SECRET is shorter than 32 characters; use openssl rand -base64 32 for production runtime.",
        );
        return fromEnv;
      }
      console.error(
        "[auth] AUTH_SECRET must be at least 32 characters in production (use openssl rand -base64 32).",
      );
      throw new Error("AUTH_SECRET is too short for production.");
    }
    if (fromEnv.length < 32 && process.env.NODE_ENV !== "production") {
      console.warn(
        "[auth] AUTH_SECRET is shorter than 32 characters; allowed in development only.",
      );
    }
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    if (isNextProductionBuild()) {
      console.warn(
        "[auth] AUTH_SECRET missing during next build. It must be set for production runtime (Vercel → Environment Variables).",
      );
      return PRODUCTION_BUILD_AUTH_SECRET_PLACEHOLDER;
    }
    console.error(
      "[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). Set a strong secret in production.",
    );
    throw new Error(
      "AUTH_SECRET is required in production. See .env.example.",
    );
  }

  console.warn(
    "[auth] AUTH_SECRET is not set; using an insecure local-only placeholder. Set AUTH_SECRET in .env.local (e.g. openssl rand -base64 32).",
  );
  return DEV_AUTH_SECRET_PLACEHOLDER;
}

export function isGoogleOAuthConfigured(): boolean {
  const id = process.env.AUTH_GOOGLE_ID?.trim() ?? "";
  const secret = process.env.AUTH_GOOGLE_SECRET?.trim() ?? "";
  return id.length > 0 && secret.length > 0;
}

export function logAuthEnvSummaryOnce(): void {
  if (loggedEnvSummary || process.env.NODE_ENV === "test") return;
  loggedEnvSummary = true;

  // Avoid noisy duplicate lines from Next.js build workers (production build).
  if (process.env.NODE_ENV !== "development") return;

  const hasSecret = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
  );
  const hasDb = Boolean(process.env.DATABASE_URL?.trim());
  const google = isGoogleOAuthConfigured();

  console.info(
    `[auth] env: AUTH_SECRET=${hasSecret ? "set" : "missing (dev fallback may apply)"}; DATABASE_URL=${hasDb ? "set" : "missing"}; Google OAuth=${google ? "configured" : "not configured"}`,
  );

  const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (dbUrl.startsWith("file:") && /prisma\/prisma\//.test(dbUrl)) {
    console.warn(
      "[auth] DATABASE_URL looks like prisma/prisma/... SQLite paths in DATABASE_URL are relative to the prisma/ folder; use file:./dev.db for prisma/dev.db.",
    );
  }

  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (authUrl && process.env.NODE_ENV === "development") {
    try {
      const u = new URL(authUrl);
      if (!u.hostname.includes("localhost")) {
        console.warn(
          `[auth] AUTH_URL/NEXTAUTH_URL is ${u.origin}; for local dev use http://localhost:3000 or omit it so the request host is used.`,
        );
      }
    } catch {
      console.warn("[auth] AUTH_URL/NEXTAUTH_URL is set but could not be parsed.");
    }
  }
}
