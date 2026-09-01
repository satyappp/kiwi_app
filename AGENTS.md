# Project architecture

**Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before adding or changing a feature.**

Quick orientation:

- Code lives under `src/`. Path alias `@/*` → `src/*`.
- Two surfaces, one backend: `(ops)` = phone-first quick-entry (`/`, `/harvest/new`, …), `(admin)` = PC dashboard (`/dashboard`). Route groups, so no URL segment. The split is layout + entry point only — never fork business logic on device.
- **Vertical feature slices**: `src/features/<name>/` holds `components/`, `schema.ts` (zod = source of truth), `queries.ts` (reads), `actions.ts` (`"use server"` writes), `index.ts` (the only public import surface).
- **Layered**: routing → presentation → application → domain → data access → infrastructure. Dependencies point down only. `page.tsx` is thin (fetch + compose). Only `queries.ts` / `actions.ts` touch Supabase.
- Backend is deferred — `queries.ts` returns placeholder data marked `TODO(supabase)`; get the UI working first.
- Before commit: `npx tsc --noEmit && npx eslint src && npm run build`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
