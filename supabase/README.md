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

## Tables

| table | maps to | notes |
|---|---|---|
| `profiles` | スタッフ | 1:1 with `auth.users`, auto-created on signup |
| `varieties` | 品種 | seeded from CSV; app can add via "その他/新規" |
| `plots` | 番地 | seeded from CSV |
| `tree_blocks` | 樹体 | associated with a plot for dropdown filtering; app can add per plot |
| `harvest_logs` | 収穫入力 | see `harvest_logs_expanded` view for the flat CSV-shaped read |

`work_time` defaults to the current Japan time. When the optional UI field is
blank, the insert mapping must omit the column; it must not send `NULL` or an
empty string, otherwise the database default cannot apply.
