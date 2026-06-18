import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Don't put this client in a global variable. Always create a new client
 * within each function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component; can be ignored with proxy refresh.
          }
        },
      },
    },
  )
}

/**
 * Service-role client for privileged admin/server actions that must bypass RLS
 * (e.g. crediting referral bonuses to a referrer's account). Only ever use this
 * server-side after verifying the caller is an admin.
 */
export async function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    },
  )
}
