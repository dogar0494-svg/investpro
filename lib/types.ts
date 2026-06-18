export type Profile = {
  id: string
  name: string
  username: string | null
  email: string | null
  phone: string | null
  country: string
  wallet_balance: number
  total_invested: number
  total_profit: number
  referral_code: string | null
  referred_by: string | null
  is_blocked: boolean
  role: "user" | "admin"
  created_at: string
}

export type Plan = {
  id: string
  name: string
  icon: string
  min_deposit: number
  max_deposit: number
  daily_profit: number
  duration_days: number
  total_return: number
  color: string
  featured: boolean
  created_at: string
}

export type TxType = "deposit" | "withdrawal" | "investment" | "profit" | "referral" | "adjustment"
export type TxStatus = "pending" | "approved" | "rejected" | "completed"

export type Transaction = {
  id: string
  user_id: string
  type: TxType
  amount: number
  status: TxStatus
  payment_method: string | null
  account_number: string | null
  proof_image: string | null
  description: string | null
  referred_user_id: string | null
  plan_id: string | null
  created_at: string
  updated_at: string
}

export type Investment = {
  id: string
  user_id: string
  plan_id: string | null
  plan_name: string
  plan_daily_profit: number
  plan_duration_days: number
  plan_total_return: number
  amount: number
  start_date: string
  end_date: string
  last_processed: string
  status: "active" | "completed" | "cancelled"
  profit_earned: number
}

export type Settings = {
  id: string
  jazzcash_number: string | null
  jazzcash_name: string | null
  easypaisa_number: string | null
  easypaisa_name: string | null
  referral_bonus_percent: number
  min_withdrawal: number
}
