"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ActionResult = { ok: boolean; error?: string }

export async function updateProfile(formData: {
  name: string
  username: string
  phone: string
  country: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated." }

  const name = formData.name.trim()
  const username = formData.username.trim()
  if (!name) return { ok: false, error: "Name is required." }
  if (!username) return { ok: false, error: "Username is required." }

  // Ensure username is unique (excluding the current user).
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle()
  if (existing) return { ok: false, error: "That username is already taken." }

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      username,
      phone: formData.phone.trim(),
      country: formData.country.trim() || "Pakistan",
    })
    .eq("id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function changePassword(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 6) return { ok: false, error: "Password must be at least 6 characters." }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated." }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
