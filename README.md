# ReFruits

ReFruits is a phone-first farm operations app for managing kiwifruit from
harvest through sorting, ripening, inventory, and shipment. Field staff get a
fast PWA-style input experience, while the same Supabase backend is intended to
support a wider management dashboard for office use.

The interface is primarily Japanese because it is designed for day-to-day use
by farm staff.

## Project status

ReFruits is under active development. The current `dev` baseline contains the
following functionality:

| Area | Status | What works now |
| --- | --- | --- |
| Authentication | Implemented | Email/password login, logout, and farm-code-protected account creation |
| Home | Implemented | Phone-first quick-entry menu and task preview |
| 収穫登録 | Connected | Harvest input using live Supabase master data and database-generated fields |
| 選果入力 | Connected | Sorting records linked to a harvest, size standards, remaining-weight display, and overage warning |
| 追熟開始 | Connected | Ripening batches, source-weight allocation, schedule calculation, current status, and confirmation actions |
| Dashboard | Placeholder | Auth-protected `/dashboard` route; management content is still being developed |
| 冷蔵保管・出荷処理・受注確認 | Placeholder | Home buttons are visible but do not yet have completed workflows |

Placeholder UI must not be treated as live operational data.

## Technology

- [Next.js 16](https://nextjs.org/) with the App Router and React Server Components
- React 19 and TypeScript
- Tailwind CSS 4 and shadcn/ui-style primitives
- Supabase Auth and PostgreSQL
- React Hook Form and Zod for shared client/server validation
- Recharts for future dashboard visualizations
- PWA manifest with a standalone, phone-first entry experience

## Application surfaces

The project has two interfaces over the same authentication, database, and
domain logic:

| Surface | Routes | Intended use |
| --- | --- | --- |
| Operational app | `/`, `/harvest/new`, `/sorting/new`, `/ripening/new` | Fast field entry on phones and installed PWAs |
| Management app | `/dashboard`, `/dashboard/*` | Wider desktop views, summaries, and analysis |

Both surfaces are protected by Supabase authentication. The route split is for
presentation and workflow—not separate business logic.

## Prerequisites

Install the following before starting:

- Node.js 24 or newer
- npm 11 or newer
- Access to the project's Supabase instance, or a new Supabase project for a
  separate environment

Confirm your versions:

```bash
node --version
npm --version
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in all four variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

# Server-only: never expose these with a NEXT_PUBLIC_ prefix.
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
KIWI_SIGNUP_CODE=YOUR_PRIVATE_FARM_CODE
```

`KIWI_SIGNUP_CODE` must be at least 16 characters and should not be based on the
farm name, address, or phone number. `.env.local` is ignored by Git; never
commit real keys or the farm code.

See [Authentication setup](docs/AUTH_SETUP.md) for the required Supabase Auth
settings.

### 3. Create the database

For a new Supabase project, apply the migrations in this exact order:

1. `supabase/migrations/20260901120000_harvest_schema.sql`
2. `supabase/migrations/20260901130000_sorting_schema.sql`
3. `supabase/migrations/20260902120000_sorting_date_input.sql`
4. `supabase/migrations/20260902130000_ripening_schema.sql`
5. `supabase/migrations/20260907193000_sync_variety_master.sql`

Open **Supabase Dashboard → SQL Editor**, paste one complete file, run it, and
only then proceed to the next file. The migrations establish tables, seed
master data, create derived views and triggers, and enable Row Level Security.

Read [Supabase setup and schema notes](supabase/README.md) before applying or
changing migrations.

### 4. Configure operational master data

The migrations seed the known varieties, plots, tree blocks, size standards,
and ripening rules. Before using ripening in a new environment, add the farm's
real locations to `public.ripening_locations` and complete any ripening-rule
values that remain undecided (`NULL`).

### 5. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first use, choose
`アカウント作成`, enter the private farm code, and create a staff account.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create and validate the production build |
| `npm run start` | Run the previously built production app |
| `npm run lint` | Run ESLint across the repository |
| `npx tsc --noEmit` | Run strict TypeScript checking without emitting files |

Before opening a pull request, run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Current workflows

### Authentication

- Public Supabase signup should remain disabled.
- `/signup` validates the farm code on the server, then uses the server-only
  Supabase Admin client to create a confirmed user.
- A `profiles` row is created automatically from the new user's display name.
- Signed-out users are redirected to `/login`.

### Harvest — 収穫登録

Staff select the work date/time, plot, optional tree block, variety, optional
branch, editable sorting deadline, weight, and notes. The database supplies or
derives the record ID, signed-in staff member, timestamps, title, harvest year,
and harvest month. The sorting deadline defaults to 30 days after the work date
but remains editable.

### Sorting — 選果入力

Staff choose an existing harvest, sorting date, size standard, and weight.
Variety, plot, and harvest context are inherited from the selected harvest.
The database derives the ethylene-start deadline as 14 days after the sorting
date. Exceeding the remaining unsorted weight produces a warning without
blocking field work.

### Ripening — 追熟開始

Staff allocate available sorted weight into a ripening batch, choose or add a
location, and confirm processing conditions. The database prevents duplicate
weight allocation, snapshots the applied rule, calculates processing, resting,
and shipping timestamps, and exposes the next required check through read
views. The form initially selects the sorting source with the nearest ethylene
deadline, prefills its available weight, then fills conditions from the
month-and-variety master and the latest batch for the same variety. Staff can
still select another source and edit every prefilled value before confirming.

## Database overview

| Table | Responsibility |
| --- | --- |
| `profiles` | Staff identity associated one-to-one with Supabase Auth |
| `varieties` | Fruit variety master data |
| `plots` | Farm plot master data |
| `tree_blocks` | Optional tree/block data belonging to a plot |
| `harvest_logs` | Harvest work records |
| `size_standards` | Sorting size/grade master data |
| `sorting_logs` | Sorting records linked to harvests |
| `ripening_locations` | Ripening location master data |
| `ripening_rules` | Month-and-variety processing conditions |
| `ripening_batches` | Individual ripening runs and calculated schedule |
| `ripening_batch_items` | Sorting-weight allocations within each batch |

Flattened and aggregate database views provide display-ready reads without
duplicating names or derived totals in application code. The complete table and
view reference is in [supabase/README.md](supabase/README.md).

## Security model

- Row Level Security is enabled by the migrations.
- Browser requests use the authenticated user's Supabase session.
- Staff identity on operational records comes from `auth.uid()` rather than a
  client-provided staff value.
- `SUPABASE_SECRET_KEY` and `KIWI_SIGNUP_CODE` are server-only.
- Forms are validated with Zod in the browser and again in server actions.
- Database constraints and triggers remain authoritative for relationships,
  allocation totals, timestamps, and derived values.
- Anonymous clients are not granted operational table access.

Never import the admin client into a Client Component and never add a
`NEXT_PUBLIC_` prefix to a secret.

## Project structure

```text
src/
├── app/                    # Routes and auth-protected layouts
│   ├── (auth)/             # Login and signup
│   ├── (ops)/              # Phone-first operational routes
│   └── (admin)/            # Desktop management routes
├── components/
│   ├── layout/             # Shared application chrome
│   └── ui/                 # Feature-independent UI primitives
├── features/
│   ├── auth/
│   ├── harvest/
│   ├── home/
│   ├── ripening/
│   └── sorting/
└── lib/
    └── supabase/           # Browser, server, admin, and session clients

supabase/
├── migrations/             # Canonical SQL history
└── README.md               # Database setup and schema reference

docs/
├── ARCHITECTURE.md         # Code organization and conventions
└── AUTH_SETUP.md           # Supabase Auth configuration
```

Each feature keeps its UI, domain schema, reads, and server actions together.
Route files should stay thin; Supabase queries belong in feature query/action
modules rather than presentation components. See
[Architecture and conventions](docs/ARCHITECTURE.md) before adding a feature.

## Team workflow

1. Start from an up-to-date `dev` branch.
2. Create a focused feature or fix branch.
3. Preserve unrelated work in the shared repository.
4. Add database changes as a new ordered migration; do not silently edit an
   already-applied migration.
5. Update documentation when setup, schema, routes, or conventions change.
6. Run TypeScript, lint, and production-build checks.
7. Commit small, coherent changes and open a pull request into `dev`.

## Additional documentation

- [Architecture and conventions](docs/ARCHITECTURE.md)
- [Authentication setup](docs/AUTH_SETUP.md)
- [Supabase schema and migration guide](supabase/README.md)
