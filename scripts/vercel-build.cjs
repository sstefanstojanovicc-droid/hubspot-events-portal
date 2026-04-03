/**
 * Vercel / CI build entry: avoids shell-specific env (cross-env) and fails fast with a clear message
 * when DATABASE_URL is missing (common Prisma error on Vercel).
 *
 * Pipeline: prisma generate → prisma migrate deploy → next build
 * (intentionally NO prisma db seed — run `npm run db:seed` manually when needed.)
 */
const { execSync } = require("node:child_process");

function resolveGitSha() {
  const v = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (v) return v;
  const g = process.env.GITHUB_SHA?.trim();
  if (g) return g;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const sha = resolveGitSha();
const ref =
  process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
  process.env.VERCEL_GIT_BRANCH?.trim() ||
  process.env.GITHUB_REF_NAME?.trim() ||
  "(unknown)";

console.log(
  `[vercel-build] pipeline=no-seed prisma=generate+migrate next=build sha=${sha ?? "unknown"} ref=${ref}`,
);

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl) {
  console.error(`
[hubspot-events-portal] Build stopped: DATABASE_URL is not set.

In Vercel: Project → Settings → Environment Variables
  • Add DATABASE_URL (PostgreSQL). Use Neon, Vercel Postgres, or Supabase.
  • Enable it for "Production" (and Preview if you deploy previews).
  • Use a direct / non-pooling URL if "migrate deploy" fails with pooler errors.

Then redeploy.
`);
  process.exit(1);
}

const baseEnv = { ...process.env };

function run(cmd, envExtra = {}) {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...baseEnv, ...envExtra },
    shell: true,
  });
}

run("npx prisma generate");
run("npx prisma migrate deploy");
run("npx next build", { NEXT_PHASE: "phase-production-build" });
