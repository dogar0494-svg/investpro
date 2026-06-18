import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client for privileged admin operations.
 * NEVER import this into client components — it bypasses RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
