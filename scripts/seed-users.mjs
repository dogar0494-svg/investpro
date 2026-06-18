import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureUser({ email, password, meta, role }) {
  // Try to create; if exists, find and update.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { ...meta, role },
  })
  if (error && !/already/i.test(error.message)) {
    console.error("create error", email, error.message)
    return
  }
  let userId = data?.user?.id
  if (!userId) {
    // Find existing
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list?.users?.find((u) => u.email === email)
    userId = existing?.id
  }
  if (!userId) {
    console.error("could not resolve user id for", email)
    return
  }
  // Ensure role on profile (trigger created it).
  await admin
    .from("profiles")
    .update({ role, name: meta.name, username: meta.username, phone: meta.phone })
    .eq("id", userId)
  console.log(`OK ${role}: ${email} (${userId})`)
}

await ensureUser({
  email: "admin@investpro.com",
  password: "Admin@12345",
  role: "admin",
  meta: { name: "InvestPro Admin", username: "admin", phone: "03001234567", country: "Pakistan" },
})

await ensureUser({
  email: "demo@investpro.com",
  password: "Demo@12345",
  role: "user",
  meta: { name: "Demo User", username: "demouser", phone: "03009876543", country: "Pakistan" },
})

// Give the demo user a starting balance so the dashboard looks alive.
const { data: list } = await admin.auth.admin.listUsers()
const demo = list?.users?.find((u) => u.email === "demo@investpro.com")
if (demo) {
  await admin.from("profiles").update({ wallet_balance: 10000 }).eq("id", demo.id)
}

console.log("Seed complete.")
process.exit(0)
