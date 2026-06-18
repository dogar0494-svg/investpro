"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

type SignUpInput = {
  name: string
  email: string
  username: string
  phone: string
  country: string
  password: string
  referred_by: string | null
}

export async function registerUser(input: SignUpInput): Promise<{ error?: string }> {
  const admin = createAdminClient()

  // Create the user already-confirmed so no email verification is required.
  const { error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      username: input.username,
      phone: input.phone,
      country: input.country,
      referred_by: input.referred_by ? input.referred_by.trim().toUpperCase() : null,
      role: "user",
    },
  })

  if (error) {
    return { error: error.message }
  }

  return {}
}
