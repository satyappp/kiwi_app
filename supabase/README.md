# Supabase

Canonical SQL lives in `migrations/`, applied by pasting into the
**Supabase Dashboard → SQL editor** (we are not using the Supabase CLI yet).

## Apply a migration

1. Open the file under `migrations/`.
2. Copy its whole contents into the SQL editor and run it. Each file is
   written to be safe to run more than once.
3. Commit the file so the schema history stays in git.

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
