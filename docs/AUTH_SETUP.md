# Authentication setup

The app uses Supabase email/password authentication with closed registration.
Staff create their own account at `/signup` only when they know the farm code.

## Supabase Dashboard

1. Keep the Email provider enabled.
2. Disable **Allow new users to sign up**. The app creates approved users from
   its server after validating the farm code, so the public Auth signup API
   should remain closed.
3. In Project Settings → API Keys, create/copy a secret key. Never expose this
   key in browser code or use a `NEXT_PUBLIC_` prefix for it.

## Environment variables

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
KIWI_SIGNUP_CODE=YOUR_PRIVATE_FARM_CODE
```

`KIWI_SIGNUP_CODE` must contain at least 16 characters. Use a high-entropy code
that cannot be guessed from the farm name, address, or phone number. Configure
the same four variables in the deployment provider and restart the app after
changing them.

`.env.local` is ignored by Git. Never commit real keys or the farm code.

## Flow

- Signed-out access to `/`, `/harvest/new`, and `/dashboard` redirects to
  `/login`.
- `/signup` validates the submitted farm code on the server and creates a
  confirmed Supabase Auth user. The secret key and expected farm code are never
  sent to the browser.
- Authenticated visitors to `/login` or `/signup` redirect to `/`.
- The home header provides logout.

The later harvest migration creates/backfills `public.profiles` from Auth user
metadata, so Auth users may be created before that migration is applied.
