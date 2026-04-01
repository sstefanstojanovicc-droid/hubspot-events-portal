# Deploying to Vercel

This app is a standard **Next.js App Router** project. HubSpot access runs **only on the server** (`server-only` modules and Server Actions). No HubSpot secrets are bundled for the browser.

## Limitations (current codebase)

| Area | Behavior on Vercel |
|------|-------------------|
| **Platform mapping store** | In-memory (`client-app-mapping-store`). Resets on cold starts and is not shared across serverless instances. Search Board “install” mapping may need re-running after deploy or on a different instance. |
| **HubSpot link dev store** | In-memory (`client-connection-store`). “Connect HubSpot” UI state is not durable across invocations. |

Replacing these with a database is **out of scope** for this deployment guide; the app still **builds and runs** on Vercel, but treat provisioning state as **non-persistent** until you add storage.

## Environment variables

### Summary

| Variable | Purpose | Dev | Preview | Production | Client exposure |
|----------|---------|-----|---------|------------|-----------------|
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App token (CRM API) | Required for live HubSpot features | **Required** for live HubSpot | **Required** for live HubSpot | **Never** — server-only |
| `APP_URL` | Canonical public URL (`https://…`) for `metadataBase` and future absolute links | Optional | Optional (Vercel sets `VERCEL_URL`) | **Recommended** if using a custom domain as canonical | **No** `NEXT_PUBLIC_` — server-only read in `deployment-url.ts` |
| `VERCEL_URL` | Hostname of the deployment | N/A | **Auto-set by Vercel** | **Auto-set by Vercel** | Not a secret |
| `NODE_ENV` | Node environment | `development` / `production` | **`production`** at runtime | **`production`** | Framework |

### Auth / cookies

- **No OAuth or `NEXTAUTH_*`** in this repo today.
- Dev impersonation cookies (`DEV_VIEW_COOKIE`, `DEV_CLIENT_COOKIE`) use `httpOnly`, `sameSite: 'lax'`, and `secure` when `NODE_ENV === 'production'` (true on Vercel **Preview** and **Production**).

### HubSpot

- **`HUBSPOT_ACCESS_TOKEN`**: only read in `src/lib/hubspot/env.ts` and modules that import it (all `server-only` or server actions). **Do not** prefix with `NEXT_PUBLIC_`.

**Preview vs Production:** You may use a **sandbox HubSpot portal/token** in Preview and a **production portal/token** in Production by scoping env vars per environment in the Vercel UI.

### App URL / routing

- Redirects in server actions use **relative paths** (e.g. `/admin/...`) — safe on any host.
- **`APP_URL`**: optional; when set, it wins over `VERCEL_URL` for `metadataBase` in `app/layout.tsx`. Use your **custom production domain** once connected.
- **`VERCEL_URL`**: automatically provided; `deployment-url.ts` prepends `https://`.

### Storage / DB / platform mapping

- **No database env vars** yet.
- Mapping and install state are **in-memory** — see limitations above.

### Other / secrets

- **No** `NEXT_PUBLIC_*` variables are **required** today.
- Do not add `NEXT_PUBLIC_` to any secret (HubSpot token, internal API keys).

## Vercel project setup

**`vercel.json`** is **not** required; Next.js is auto-detected. Defaults:

- **Framework**: Next.js
- **Build**: `next build`
- **Output**: Next.js server output (Node serverless / Edge where applicable)

Optional overrides are only needed if you customize the monorepo root or install; this repo is a single app at the repository root.

## Vercel UI checklist

1. **Import repo**  
   - Vercel → Add New → Project → Import Git repository → select this repo → confirm root directory and framework **Next.js**.

2. **Add environment variables**  
   - Settings → Environment Variables  
   - Add **`HUBSPOT_ACCESS_TOKEN`** (secret) for **Preview** and/or **Production** as needed.  
   - Optionally add **`APP_URL`** for Production (e.g. `https://portal.example.com`) once you use a custom domain as canonical.

3. **Deploy preview**  
   - Push a branch or open a PR; Vercel creates a **Preview** deployment.  
   - Confirm build logs show `next build` success.

4. **Test preview**  
   - Open the `*.vercel.app` URL over **HTTPS**.  
   - Smoke-test navigation, Search Board (with token set for Preview if you use live HubSpot).  
   - Remember: in-memory mapping may require re-install or re-connect after cold starts.

5. **Promote to production**  
   - Merge to your production branch (e.g. `main`).  
   - Vercel deploys **Production** with Production env vars.  
   - Attach a **custom domain** under Project → Settings → Domains; set **`APP_URL`** to match if you rely on canonical URLs/metadata.

## Post-deploy checks

- [ ] Production build green (no failed step in Vercel).  
- [ ] App loads over HTTPS.  
- [ ] No HubSpot token in browser **Sources** / **Network** (requests go to your Next server, not exposing the token to the client bundle).  
- [ ] `HUBSPOT_ACCESS_TOKEN` set for the target environment.  
- [ ] After custom domain: `APP_URL` aligned with primary domain (optional but recommended).

## Rollback

- Vercel **Deployments** tab → select a previous **Ready** deployment → **Promote to Production** (or restore that deployment).  
- Alternatively revert the Git commit on `main` and redeploy.

## Local development

```bash
cp .env.example .env.local
# Edit .env.local — set HUBSPOT_ACCESS_TOKEN at minimum
npm install
npm run dev
```

## Acceptance (GitHub → Vercel)

- [x] Single Next.js app at repo root; `npm run build` is the production build.  
- [x] HubSpot token only on server; no `NEXT_PUBLIC_` HubSpot vars.  
- [x] Relative redirects; deployment-aware `metadataBase` via `VERCEL_URL` / `APP_URL`.  
- [ ] **You** add `HUBSPOT_ACCESS_TOKEN` (and optional `APP_URL`) in Vercel — placeholders only in `.env.example`.  
- [ ] **You** accept in-memory mapping limitations or plan a DB migration later.

## Publishing to GitHub

This repo is ready to push. **Do not commit `.env.local`** (it stays ignored); use **`.env.example`** as the template.

1. On [GitHub](https://github.com/new), create a **new repository** (empty, no README required, or add a README and merge later).
2. In your project directory:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

3. If GitHub shows “repository not empty”, use the commands GitHub suggests after you add the remote (sometimes `git pull origin main --allow-unrelated-histories` then push).

SSH example:

```bash
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```

**Optional:** Install [GitHub CLI](https://cli.github.com/) and run `gh auth login` then `gh repo create hubspot-events-portal --private --source=. --push`.
