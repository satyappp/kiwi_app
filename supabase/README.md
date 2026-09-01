# Supabase

Canonical SQL lives in `migrations/`, applied by pasting into the
**Supabase Dashboard → SQL editor** (we are not using the Supabase CLI yet).

## Apply a migration

1. Open the file under `migrations/`.
2. Copy its whole contents into the SQL editor and run it. Each file is
   written to be safe to run more than once.
3. Commit the file so the schema history stays in git.

## After `20260901120000_harvest_schema.sql`

The harvest form writes as the **signed-in user** (`staff_id` defaults to
`auth.uid()`), so a login is required before it works end to end:

1. **Create a staff user**: Dashboard → Authentication → Users → Add user.
   Set the display name in user metadata as `display_name` (e.g. `原口`),
   or afterwards:
   `update public.profiles set display_name = '原口' where id = '<uuid>';`
2. Build the login page + wire the form action (app side, next step).

## Tables

| table | maps to | notes |
|---|---|---|
| `profiles` | スタッフ | 1:1 with `auth.users`, auto-created on signup |
| `varieties` | 品種 | seeded from CSV; app can add via "その他/新規" |
| `plots` | 番地 | seeded from CSV |
| `tree_blocks` | 樹体 | belongs to a plot; app can add per plot |
| `harvest_logs` | 収穫入力 | see `harvest_logs_expanded` view for the flat CSV-shaped read |
