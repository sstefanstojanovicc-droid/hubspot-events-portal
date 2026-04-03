/**
 * Vercel / CI build entry: avoids shell-specific env (cross-env) and fails fast with a clear message
 * when DATABASE_URL is missing (common Prisma error on Vercel).
 */
const { execSync } = require("node:child_process");

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
if (process.env.SKIP_DB_SEED !== "true" && process.env.SKIP_DB_SEED !== "1") {
  run("npx prisma db seed");
}
run("npx next build", { NEXT_PHASE: "phase-production-build" });
