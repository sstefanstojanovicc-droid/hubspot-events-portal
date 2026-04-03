# HubSpot Operations Platform — Architecture

One unified multi-tenant platform for managing client HubSpot implementations, automation, and applications. This document describes **target structure**, **navigation**, and a **minimal migration path** from the current codebase. It does not require a full rebuild.

---

## 1. Target folder structure (App Router)

Routes are grouped by **who** is operating (platform admin vs client tenant) and **what** surface (shell, workspace, module).

```
app/
├── (marketing)/                    # optional future: public marketing
├── auth/                           # sign-in (unchanged)
├── api/                            # webhooks + auth (unchanged)
│
├── (platform)/                     # single shell: layout = DashboardShell
│   ├── layout.tsx
│   ├── dashboard/                  # ① Admin overview — all clients, alerts, activity
│   │   └── page.tsx
│   │
│   ├── platform/                   # ④ Settings — operator / system (rename from admin/)
│   │   ├── clients/
│   │   ├── settings/
│   │   ├── integrations/
│   │   ├── package-library/
│   │   ├── templates/
│   │   ├── apps/                   # module registry / enablement (admin)
│   │   ├── diagnostics/
│   │   └── ...
│   │
│   └── workspace/                  # ② Client workspace — tenant-scoped
│       └── clients/
│           └── [slug]/
│               ├── layout.tsx      # workspace chrome + context
│               ├── page.tsx        # workspace home / dashboard
│               ├── hubspot/        # connection, tier, sync, portal tools
│               ├── resources/      # SOWs, files, calls, notes, docs (aggregate + AI ingest)
│               ├── intelligence/   # AI automation & solution building (rename from hubspot-ai/)
│               ├── provisioning/   # optional UI for install plans / status (reads lib/provisioning)
│               ├── settings/       # client settings, branding link, permissions/billing placeholders
│               ├── modules/        # ③ App/module mounts (preferred) OR keep flat apps below
│               │   ├── search-board/
│               │   ├── ai-builder/         # shell for AI Automation Builder product area
│               │   ├── cpq/
│               │   ├── financial-broker/
│               │   └── calendar-events/
│               ├── action-plans/
│               ├── packages/
│               ├── users/
│               ├── logs/
│               └── training/
│
└── (legacy-routes)/               # temporary redirects only — see §6
```

**`src/lib/` (server) — domain alignment**

```
src/lib/
├── platform/           # tenants, users, branding, app mappings, effective config (keep)
├── hubspot/            # token client, CRM helpers, env (keep)
├── provisioning/       # writes into HubSpot — install pipelines (keep)
├── search-board/       # Candidate Search Board domain (keep)
├── intelligence/       # rename from hubspot-ai/ when convenient — AI plans, chat, resources API
├── workspace/          # client-scoped: action plans, packages, fathom, activity (keep; widen “resources” later)
├── modules/            # optional: thin adapters per module (install flags, deep links)
└── auth/               # (keep)
```

**`src/components/`**

```
src/components/
├── shell/              # DashboardShell, CollapsibleWorkspaceShell, dev switcher (move from dashboard/)
├── platform/           # admin + cross-cutting (keep)
├── workspace/          # client workspace UI (keep)
├── modules/
│   └── search-board/   # move from search-board/ when routes move
├── intelligence/       # move from hubspot-ai/ when renaming
└── ...
```

*Note:* The exact `(platform)` group name can stay `(dashboard)` in code until a rename batch; what matters is **one layout** and **clear URL semantics**.

---

## 2. Navigation hierarchy

### Platform operator (internal admin)

| Level | Purpose |
|--------|---------|
| **Dashboard** | `/dashboard` — all clients, connection status, recent activity, alerts (monitoring only). |
| **Platform** | `/platform/clients`, `/platform/settings`, … — deep configuration, not daily monitoring. |
| **Enter client workspace** | From client row → `/workspace/clients/[slug]` (or current `/clients/[slug]` during migration). |

### Client workspace (full context for one tenant)

| Level | Purpose |
|--------|---------|
| **Home** | Snapshot: portal health, modules enabled, recent resources, AI/provisioning status. |
| **HubSpot** | Connection, tier/configuration tracking, sync logs, object tooling (existing `hubspot/*`). |
| **Resources** | Files, calls (Fathom), notes, docs, SOWs — normalized list + storage; feeds AI. |
| **Intelligence** | AI automation builder, plans, threads — **core capability** (current `hubspot-ai/*`). |
| **Modules** | Installed applications: Search Board, CPQ, Financial Broker, Calendar & Events — consistent sub-nav per module. |
| **Settings** | Client profile, placeholders for billing/permissions, link to platform branding for admins. |

### Applications / modules (consistent pattern)

Each module under the workspace:

- **Entry:** `/workspace/clients/[slug]/modules/<module-id>`
- **Install/configure (admin):** `/platform/clients/[id]/modules/<module-id>/install` (or keep existing install paths during migration)
- **Shared rules:** uses that client’s `hubspotPortalId`, reads `client-app-mapping` / provisioning state, no separate “global” HubSpot context.

---

## 3. Client workspace — internal structure

| Area | Responsibility | Source of truth for |
|------|----------------|---------------------|
| **Workspace home** | High-level health, quick actions | N/A (aggregates) |
| **HubSpot** | Connection, portal metadata, sync | `clientAccount`, HubSpot APIs, token store |
| **Resources** | Artifacts & structured inputs for AI | DB tables + object storage (evolve from Fathom + future file models) |
| **Intelligence** | AI plans, execution, chat | `src/lib/hubspot-ai/` → `intelligence/` |
| **Provisioning** | What was written to HubSpot | `src/lib/provisioning/*` + persisted install reports |
| **Modules** | User-facing app surfaces | Per-module routes + `search-board` domain |

---

## 4. Applications / modules — structure

Define a **module registry** (extend `config/blueprints/registry.ts` / portal-registry pattern):

| Module ID | Product name | Route segment | Status |
|-----------|----------------|-------------|--------|
| `search_board` | Candidate Search Board | `search-board` | Active |
| `ai_automation` | AI Automation Builder | `ai-builder` | Shell + intelligence home |
| `cpq` | Custom CPQ | `cpq` | Placeholder page |
| `financial_broker` | Financial Broker Applications | `financial-broker` | Placeholder page |
| `calendar_events` | Calendar & Events | `calendar-events` | Placeholder page |

Each module package:

```
modules/<id>/
├── page.tsx              # client workspace entry
├── layout.tsx            # optional module subnav
├── settings/             # module-specific client settings (optional)
└── ...                   # feature routes (e.g. search-board/shortlists)
```

Reuse **one shell**: same `DashboardShell` / workspace layout; only inner nav changes.

---

## 5. Where AI, resources, and provisioning live

| Concern | Layer | Today | Target name / home |
|---------|--------|--------|---------------------|
| **AI** (plans, chat, automation) | Domain lib + UI | `src/lib/hubspot-ai/`, `components/hubspot-ai/` | `src/lib/intelligence/`, `components/intelligence/`; routes `.../intelligence/*` |
| **Resources** (inputs to AI) | Domain + DB | Fathom (`workspace/fathom-repo`), AI resource actions | `workspace/resources/*` + expand models; same data consumed by intelligence |
| **Provisioning** (writes HubSpot) | Domain lib | `src/lib/provisioning/*`, `search-board-live-install.ts` | Keep; optional thin **UI** under `workspace/.../provisioning` for status/plans |
| **HubSpot connection** | Platform + per client | `hubspot/client.ts`, `platform/client-connection-store`, `effective-client` | Unchanged |

**Data flow (rules):**

1. **Resources** → indexed / summarized → **Intelligence** (AI context).
2. **Intelligence** produces **plans** → **Provisioning** executes → **HubSpot** mutates.
3. **Modules** consume CRM via **Search Board** pattern (mapping + `hubspot-crm`).

Server-side token only until OAuth app exists; keep all secrets server-side.

---

## 6. Minimal code movement plan (phased)

**Phase A — Naming & docs (no route breaks)**  
- Product string: `BRANDING_APP_NAME`, `metadata.title`, user-facing copy → “HubSpot Operations Platform”.  
- Add this doc; align `AGENTS.md` one-liner if present.

**Phase B — URL aliases (optional `next.config` redirects)**  
- `/admin/*` → `/platform/*` (301 or 308) when ready.  
- Keep old paths working for one release.

**Phase C — Group routes under one shell**  
- Merge `(dashboard)` segments: ensure single `layout.tsx` with `DashboardShell`.  
- Introduce `app/(platform)/workspace/clients/[slug]` by **moving** from `clients/[slug]` with rewrites.

**Phase D — Modules**  
- Move `app/(dashboard)/apps/search-board/*` → `workspace/clients/[slug]/modules/search-board/*` **or** keep global `apps/search-board` but **navigate from workspace** with `clientId` in context (smaller move).  
- Recommended: **workspace-scoped URLs** for all modules long-term; interim: dual paths + redirect.

**Phase E — Intelligence rename**  
- Rename folder `hubspot-ai` → `intelligence` in `src/lib` and `components` (update imports).  
- Routes: `hubspot-ai` → `intelligence` with redirects.

**Phase F — Resources**  
- Add `resources/` route; initially **links** to existing Fathom + file placeholders; consolidate into one “Resources” hub without deleting repos.

**Do not** in early phases: change Prisma schema wholesale, OAuth, or Search Board CRM logic.

---

## 7. Preserved systems

| System | Location | Notes |
|--------|----------|--------|
| HubSpot connection / token | `src/lib/hubspot/*`, env | Unchanged |
| Provisioning / live install | `src/lib/provisioning/*` | Unchanged |
| Search Board | `src/lib/search-board/*`, app routes | Preserve; only relocate under workspace when ready |
| Client mapping / installs | `client-app-mapping-store`, admin install pages | Preserve |
| Auth / multi-tenant | `auth.ts`, `workspace-context`, `requireClientWorkspaceBySlug` | Preserve |

---

## Summary

- **One shell**, **multi-tenant clients**, **one HubSpot portal per client**.  
- **Dashboard** = operator monitoring. **Client workspace** = source of truth for AI, provisioning, and apps. **Platform settings** = global configuration.  
- **Modules** share structure and run inside the workspace.  
- **AI** is **Intelligence**; **resources** feed it; **provisioning** executes against HubSpot.  
- Migrate in **small phases** with redirects and without rewriting Search Board or provisioning engines.
