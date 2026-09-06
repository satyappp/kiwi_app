import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { AppDatabase } from "@/lib/supabase/app-database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<AppDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.

  // Validate/refresh the current authentication state.
  await supabase.auth.getClaims();

  // IMPORTANT: You *must* return the `response` object as it is. If you create
  // a new response with NextResponse.next(), make sure to:
  // 1. Pass the request in it: NextResponse.next({ request })
  // 2. Copy over the cookies: newResponse.cookies.setAll(response.cookies.getAll())
  // 3. Avoid changing the cookies.
  return response;
}
