# HubSpot Application Platform

Reusable Next.js + TypeScript + Tailwind scaffold for building multiple HubSpot-driven products, including candidate shortlist portals, event management portals, and custom calendar/data tools.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Config-driven module architecture

## Platform Design Goals

- Treat HubSpot as source of truth (standard objects + custom objects)
- Keep UI generic: list, detail panel, and filter bar are reusable primitives
- Keep rendering config-driven per portal/module
- Support properties and associations in a shared data model
- Make feature modules easy to add without rewriting the core

## Folder Structure

```text
app/
  (dashboard)/
    dashboard/page.tsx          # dashboard shell landing page
    objects/[objectType]/page.tsx # generic object module page
src/
  components/
    dashboard/                  # dashboard shell and navigation
    platform/                   # reusable list/detail/filter components
  config/
    portals/                    # portal-level object module configs
    portal-registry.ts          # central registry lookup
  lib/
    hubspot/                    # API client layer (placeholder + mock data)
    platform/                   # object loading + mapping logic
  types/
    hubspot.ts                  # canonical HubSpot domain types
    platform.ts                 # config + UI model types
```

## Candidate Portal Example

`src/config/portals/candidate.ts` includes a starter module for candidate records with fields from discovery:

- name
- current title
- written summary
- location
- gender

This is a generic object module and can be duplicated for events, calendars, or other CRM-backed flows.

## Getting Started

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/objects/2-39167811`

## Next Implementation Steps

1. Replace mock records in `src/lib/hubspot/client.ts` with authenticated HubSpot API calls.
2. Add server actions/API routes for shortlist creation and secure-share links.
3. Add module configs for event objects, calendar views, and additional custom objects.
4. Implement role-aware auth for internal consultant and external client experiences.
