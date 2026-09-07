# Supabase

Canonical SQL lives in `migrations/`, applied by pasting into the
**Supabase Dashboard → SQL editor** (we are not using the Supabase CLI yet).

## Apply a migration

1. Open the file under `migrations/`.
2. Copy its whole contents into the SQL editor and run it. Each file is
   written to be safe to run more than once.
3. Commit the file so the schema history stays in git.
4. Regenerate the TypeScript types: `npm run db:types`. Commit the updated
   `src/lib/supabase/database.types.ts` in the same change. Run `npx tsc
   --noEmit` afterwards — a red build here means app code referenced a column
   the migration renamed or dropped.

`npm run db:types` reads the **live** hosted schema (project
`kgpvgpddoajuhljmeaul`) and rewrites `database.types.ts`. It needs the
Supabase CLI authenticated once via `npx supabase login`. If the command
prints nothing and the file is unchanged, the code already matches the
database.

## Authentication

Authentication is implemented in the app. Closed signup validates the
server-only farm code before creating a Supabase Auth user. Keep public
Supabase signup disabled.

Running `20260901120000_harvest_schema.sql` automatically creates profiles for
future signups and backfills profiles for Auth users that already exist.

## After `20260901130000_sorting_schema.sql`

Run it only after the harvest migration. Selection records reference
`harvest_logs`, and inherit variety, plot, harvest title, and sorting deadline
from the selected harvest row.

The eight current size standards (`5L`, `4L`, `3L`, `LL`, `L`, `M`, `S`,
`SS`) are seeded automatically. One sorting log records one harvest, one size,
and one weight. The form defaults the sorting date to today but allows another
date to be selected. The database sets the signed-in staff, input timestamp,
and ethylene-start deadline (14 days after the selected sorting date).

## After `20260902130000_ripening_schema.sql`

Run it after both sorting migrations. Ripening batch items reference individual
`sorting_logs` rows so the database can prevent the same sorted weight from
being allocated twice.

The migration imports the 77 month/variety rows from the provided ripening
master sheet. Only the values that exist in the sheet are seeded: October
`紅妃` uses 48 hours of ethylene treatment and 15°C for 120 hours of resting.
All undecided settings remain `NULL`; the source sheet explicitly describes
its contents as provisional, so the migration does not invent operating
conditions. The start form fills missing master values from the latest batch
for the same variety when one exists. When that month and variety does not yet
have all four temperature/time values, a confirmed registration saves them as
the standard condition by default, so later registrations no longer require
the same manual entry. A complete existing standard is not overwritten unless
the worker explicitly enables the save; the save can also be turned off for an
exceptional batch. Add the farm's actual ripening locations to
`ripening_locations`; after the first location is registered it becomes a
reusable choice.

For each batch, the database snapshots the selected rule, calculates the
ethylene end, resting start, and shippable timestamps, and exposes the current
phase and next check through `ripening_batches_expanded`.

## Tables

| table | maps to | notes |
|---|---|---|
| `profiles` | スタッフ | 1:1 with `auth.users`, auto-created on signup |
| `varieties` | 品種 | seeded from CSV; app can add via "その他/新規" |
| `plots` | 番地 | seeded from CSV |
| `tree_blocks` | 樹体 | associated with a plot for dropdown filtering; app can add per plot |
| `harvest_logs` | 収穫入力 | see `harvest_logs_expanded` view for the flat CSV-shaped read |
| `size_standards` | サイズ・規格 | seeded with 5L through SS; rows can be added later |
| `sorting_logs` | 選果作業ログ | one row per harvest, size, and weight entry |
| `ripening_locations` | 追熟場所 | active/inactive location master; no guessed locations are seeded |
| `ripening_rules` | 追熟条件マスタ | month/variety rules imported from the reference sheet |
| `ripening_batches` | 追熟ロット | one row per ripening run, including schedule and confirmations |
| `ripening_batch_items` | 追熟内訳 | sorting-log allocations and weights for each ripening batch |

### Harvest input defaults

`harvest_logs.work_time` defaults to the current Japan time. When the optional
UI field is blank, the insert mapping must omit the column; it must not send
`NULL` or an empty string, otherwise the database default cannot apply.

## Sorting read views

| view | purpose |
|---|---|
| `sorting_logs_expanded` | flat selection log with inherited harvest information |
| `harvest_sorting_status` | selected and remaining weight per harvest, with overage warning |
| `sorting_inventory` | selected inventory grouped by variety, plot, size, and ethylene deadline |

## Ripening read views

| view | purpose |
|---|---|
| `ripening_rules_expanded` | month/variety rules with variety names and configured-state flag |
| `sorting_ripening_status` | sorted, allocated, and still-available weight per sorting log |
| `ripening_batches_expanded` | batch summary, breakdown, current phase, next check, and warning state |
