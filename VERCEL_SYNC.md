# Vercel deploy out of sync with GitHub `main`

If Production shows an **old commit** (e.g. `486530e`) while GitHub `main` is newer, the problem is almost always **Vercel project ↔ Git repo/branch** settings—not this repo’s `package.json`.

## 1. Confirm GitHub is the source of truth

```bash
git remote -v
git fetch origin
git log -1 --oneline origin/main
```

Expected remote: `https://github.com/sstefanstojanovicc-droid/hubspot-events-portal.git`  
Expected branch for Production: **`main`**.

## 2. Fix the Vercel ↔ Git connection (exact clicks)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → select project **hubspot-events-portal**.
2. **Settings** → **Git**.
3. **Connected Git Repository**  
   - Must show **`sstefanstojanovicc-droid/hubspot-events-portal`** (same org/user and repo name as GitHub).  
   - If it shows a **different repo**, **fork**, or **old import**: disconnect and **Reconnect** to the correct repository (Install/authorize the GitHub app if prompted).
4. **Production Branch**  
   - Set to **`main`** (not `master`, not a feature branch).
5. **Save** if you changed anything.

## 3. Remove overrides that ignore this repo

1. **Settings** → **General**.
2. **Root Directory**  
   - Should be **empty** (repo root), unless this app lives in a subfolder (it does not).
3. **Build & Development Settings**  
   - **Framework Preset**: Next.js (or leave Auto).  
   - **Build Command**: leave **empty** so Vercel uses **`vercel.json`** → `npm run build`, or explicitly set to:  
     `npm run build`  
   - **Install Command**: leave default unless you have a reason to override.  
   - If Build Command was set to something like `prisma generate && ... && prisma db seed && next build`, **delete that** and use `npm run build` only.

## 4. Force a clean redeploy (latest commit + no stale cache)

1. **Deployments** tab → open the latest deployment (or **Create Deployment** from Git).
2. Use **Redeploy** → expand **Redeploy** options → turn **off** “Use existing Build Cache” / choose **Rebuild** without cache (wording varies).  
3. Confirm the deployment **Source** shows the **same commit SHA** as `git log -1 origin/main` on GitHub.

## 5. Confirm the build log (must match repo)

In the build log, search for:

```text
[vercel-build] pipeline=no-seed prisma=generate+migrate next=build sha=...
```

- **`pipeline=no-seed`** means **`prisma db seed` is not part of the build**.  
- **`sha=`** should equal the short/full commit you expect from `main`.

If you still see `prisma db seed` in the log, Vercel is building **an old commit** or a **different branch/repo**—return to steps 2–4.

## 6. Optional: trigger deploy without code changes

```bash
git commit --allow-empty -m "chore: trigger Vercel redeploy"
git push origin main
```

Then verify the new deployment’s commit on Vercel matches that push.
