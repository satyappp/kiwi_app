# Architecture & Conventions

The single reference for how this codebase is organised. Read before adding a
feature. Keep it current when a convention changes.

---

## 1. What we're building

A kiwi-farm operations system with **two surfaces over one backend**:

| Surface | Route | Primary device | Shell |
|---|---|---|---|
| **Operational** (quick entry) | `/home`, `/harvest/new`, … | phone (installed PWA) | mobile: centred column, watercolor backdrop, per-screen header |
| **Management** (dashboard) | `/dashboard`, `/dashboard/*` | office PC | desktop: sidebar, wide grids |

Same auth, same Supabase, same domain code. The split is about **layout and
entry point**, never about forking business logic.

### Entry behaviour

- The PWA manifest `start_url` is `/home`, so the installed phone app opens the
  quick-entry home. No device detection needed — only the installed app uses
  `start_url`.
- Web visitors land on `/`, which redirects to `/dashboard`. Login preserves a
  validated local `next` path, so an unauthenticated PWA launch returns to
  `/home` while a normal web login returns to `/dashboard`. Never sniff the
  user-agent or viewport to choose a surface.
- Both surfaces stay usable on any screen size; each is just optimised for its
  primary context.

---

## 2. Folder structure

```
src/
  app/                      ── routing only (thin)
    layout.tsx              root: <html>, fonts, metadata
    page.tsx                "/" → redirect to "/dashboard"
    (ops)/                  operational surface — route group, no URL segment
      layout.tsx            mobile shell + <KiwiBackdrop/>
      home/page.tsx         "/home"         → <QuickEntryHome/>
      harvest/new/page.tsx  "/harvest/new" → <NewHarvestScreen/>
    (admin)/                management surface — route group, no URL segment
      dashboard/
        layout.tsx          responsive sidebar / drawer shell
        page.tsx            "/dashboard"         → live harvest overview
        harvest/page.tsx    "/dashboard/harvest" → harvest table
  components/
    ui/                     shadcn primitives — design-system, feature-agnostic
    layout/                 shared chrome: <KiwiBackdrop/>, <BackButton/>, nav
  features/<name>/          ── one folder per domain, vertical slice
    components/             presentation (RSC + "use client")
    schema.ts              domain: zod schemas + derived types + shared types
    queries.ts             data access: reads (Supabase → domain objects)
    actions.ts             application: "use server" mutations / use cases
    index.ts               public surface — the ONLY thing other code imports
    server.ts              optional server-only public surface
  lib/
    supabase/              infra: server / client / proxy factories
    utils.ts               cn() and other tiny helpers
  proxy.ts                 session refresh (Next 16 "proxy", was "middleware")
```

Current features: `auth`, `home`, `harvest`, `sorting`, `ripening`. The dashboard
shell is live, with harvest as its first real data section. Planned (see task list):
`cold-storage`, `inventory`, `shipments`, `orders`, `customers`,
`tasks`, `dashboard`.

---

## 3. Layers

Dependencies point **downward only**. A lower layer never imports an upper one.

| # | Layer | Lives in | Rules |
|---|---|---|---|
| 1 | **Routing** | `src/app/**` | URL → screen. `page.tsx`/`layout.tsx` only. ~≤40 lines: fetch via a feature query, render a feature component, wire a feature action. No business logic, no `supabase` import. |
| 2 | **Presentation** | `features/*/components/**`, `components/ui/**`, `components/layout/**` | React. Data in via props, mutations via server actions. No direct Supabase (realtime hooks using the browser client are the one exception). |
| 3 | **Application** | `features/*/actions.ts`, `features/*/use-*.ts` | Use cases. `"use server"` actions: validate with the schema → call data access → `revalidatePath`/`redirect`. Return a typed result, never throw to the client. |
| 4 | **Domain** | `features/*/schema.ts`, `features/*/domain.ts` | zod schemas = source of truth for shape **and** validation. Types via `z.infer`. Pure business rules (計算・判定) as plain functions. No I/O, no React, no Supabase. |
| 5 | **Data access** | `features/*/queries.ts`, `lib/db/**` | The only place that builds Supabase queries for a feature. Maps `snake_case` rows ↔ `camelCase` domain objects. Returns domain types. |
| 6 | **Infrastructure** | `lib/supabase/**`, `lib/pdf/**`, `lib/line/**`, `lib/format/**` | External clients & framework glue. |

### Cross-feature rule

A feature imports from: `lib/`, `components/ui`, `components/layout`, and its own
folder. To use another feature, import its `index.ts`, or its `server.ts` from a
Server Component when the dependency is explicitly server-only. If two features
need the same logic, lift it to `lib/` or a shared feature — don't reach into
internals.

---

## 4. Data flow

```
Server Component (page)  ──calls──►  features/x/queries.ts  ──►  Supabase (read)
        │ props
        ▼
Client Component (form)  ──calls──►  features/x/actions.ts  ──►  Supabase (write)
        ▲                                    │
        └────── typed result ◄───────────────┘   validated by features/x/schema.ts
```

- **Reads**: Server Components call `queries.ts`. Prefer RSC; reach for a
  client data library only when a screen is genuinely interaction-heavy.
- **Writes**: Client Components call `actions.ts` (`useActionState` /
  `<form action={…}>`). The action re-validates with the same zod schema —
  never trust the client.
- After a mutation: `revalidatePath` / `revalidateTag`, then `redirect` if the
  flow moves on.
- Field-speed screens may layer `useOptimistic` on top.

---

## 5. Validation & the "don't make input annoying" requirement

The product brief weighs *fewer, safer keystrokes* above feature count. So:

- One zod schema per input, in `schema.ts`, used by **both** the RHF resolver
  (client, instant feedback) and the action (server, authoritative).
- Guard rules from the brief live in the **domain layer** as pure functions and
  are called from the action: 必須未入力を弾く / 異常な数量を警告 /
  選果量 > 収穫量 を警告 / 在庫超過の出荷を警告 / 追熟期限超過を警告.
- Carry data forward between工程 by passing IDs, not re-entering values
  (選果 selects a harvest row and inherits 品種・区画 …).
- Pre-fill date/time/担当者; make選択式 the default over free text.

---

## 6. Naming

| Thing | Rule | Example |
|---|---|---|
| Files / folders | kebab-case | `harvest-form.tsx`, `use-harvest-options.ts` |
| Components | PascalCase, one main per file, name = file | `NewHarvestScreen` |
| Server actions | verb-first | `createHarvest`, `startRipening` |
| Query fns | `get*` (one / options), `list*` (collections) | `getHarvestFormOptions` |
| Schemas | `*Schema`; types PascalCase | `harvestInputSchema` → `HarvestInput` |
| Booleans | `is` / `has` / `can` | `isOverdue`, `canShip` |
| Exports | named everywhere **except** `page.tsx` / `layout.tsx` (Next requires default) | |
| DB | `snake_case` tables & columns; plural tables | `harvest_logs` |

---

## 7. Styling

- Tailwind v4 + shadcn/ui primitives in `components/ui`.
- Design tokens in `src/app/globals.css`. Two layers:
  - Raw kiwi palette → `bg-kiwi-*` / `text-kiwi-*` (`kiwi`, `kiwi-mid`,
    `kiwi-pale`, `kiwi-amber`, `kiwi-cream`, `kiwi-tan`, `kiwi-brown`,
    `kiwi-ink`).
  - shadcn semantic tokens are **mapped to the kiwi palette**: `--primary` is
    kiwi green (so `<Button>` / `bg-primary` is green), `--background` is
    kiwi-cream, `--card` is white, borders/`--muted`/`--accent` are warm-toned,
    `--ring` is green. Use the semantic tokens for components; use `kiwi-*` for
    bespoke surfaces.
  - Font: Noto Sans JP.
- **Operational screens are fluid**, not fixed-pixel: `%` padding,
  aspect-ratio + `%` for cards/icons, `clamp(min, Ncqw, max)` for type inside
  the `@container` column. Target 360–430 px, cap the column at 440 px.
- Dashboard targets ≥1024 px with a responsive fallback.
- Page background is `<KiwiBackdrop/>` — a `fixed` cream fill with watercolor
  decor pinned to the column corners, so it survives scrolling. Never a
  `background-image` that runs out below the fold.

---

## 8. Supabase

- `lib/supabase/server.ts` → RSC & actions. `client.ts` → browser & realtime.
  `proxy.ts` → session refresh (wired in `src/proxy.ts`).
- RLS on every table; policies live in migrations.
- Required next hardening step: generate `lib/supabase/database.types.ts` from
  the linked production project with `supabase gen types typescript`, then type
  every Supabase client with `Database`. This needs a Supabase access token or
  database connection credentials; do not hand-maintain a file that claims to
  be generated. The domain layer continues to use hand-written types and the
  mapping layer bridges them.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Auth is closed registration: `/signup` validates a server-only farm code,
  then creates the user through the server-only Admin API. Public Supabase
  sign-up remains disabled. Required server-only env vars:
  `SUPABASE_SECRET_KEY`, `KIWI_SIGNUP_CODE` (minimum 16 characters).

The harvest feature is connected to the production Supabase schema. Planned
features may temporarily use placeholder data while their UI is being built;
those placeholders must remain explicit and be replaced before release.

---

## 9. Checks before commit

```
npx tsc --noEmit
npx eslint src
npm run build
```

Commits: one line, minimal, no AI co-author / session trailers.
