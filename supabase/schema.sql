-- InvestPro public schema export for a fresh Supabase project.
-- Run in the Supabase SQL Editor after creating the project. This contains schema,
-- policies, functions, and triggers only; it does not copy user or transaction data.

create table public.profiles (
  id uuid not null,
  name text not null default ''::text,
  username text,
  email text,
  phone text,
  country text not null default 'Pakistan'::text,
  wallet_balance numeric not null default 0,
  total_invested numeric not null default 0,
  total_profit numeric not null default 0,
  referral_code text,
  referred_by text,
  is_blocked boolean not null default false,
  role text not null default 'user'::text,
  created_at timestamp with time zone not null default now(),
  balance_reduction_applied_at timestamp with time zone,
  bonus_status text not null default 'locked'::text,
  bonus_unlocked_at timestamp with time zone,
  referral_earnings numeric not null default 0,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade,
  constraint profiles_username_key unique (username)
);

create table public.plans (
  id text not null,
  name text not null,
  icon text default 'fa-chart-line'::text,
  min_deposit numeric not null default 0,
  max_deposit numeric not null default 0,
  daily_profit numeric not null default 0,
  duration_days integer not null default 30,
  total_return numeric not null default 0,
  color text default '#6c63ff'::text,
  featured boolean not null default false,
  created_at timestamp with time zone not null default now(),
  original_daily_profit numeric,
  constraint plans_pkey primary key (id)
);

create table public.transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  amount numeric not null default 0,
  status text not null default 'pending'::text,
  payment_method text,
  account_number text,
  proof_image text,
  description text,
  referred_user_id uuid,
  plan_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  fee_amount numeric not null default 0,
  net_amount numeric,
  withdrawal_date date,
  referral_level integer,
  commission_rate numeric,
  original_amount numeric,
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);

create table public.investments (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  plan_id text,
  plan_name text not null,
  plan_daily_profit numeric not null default 0,
  plan_duration_days integer not null default 30,
  plan_total_return numeric not null default 0,
  amount numeric not null default 0,
  start_date timestamp with time zone not null default now(),
  end_date timestamp with time zone not null,
  last_processed timestamp with time zone not null default now(),
  status text not null default 'active'::text,
  profit_earned numeric not null default 0,
  constraint investments_pkey primary key (id),
  constraint investments_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);

create table public.referral_commissions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  source_user_id uuid not null,
  source_transaction_id uuid not null,
  level integer not null,
  rate numeric not null,
  amount numeric not null,
  created_at timestamp with time zone not null default now(),
  constraint referral_commissions_pkey primary key (id),
  constraint referral_commissions_level_check check ((level >= 1) and (level <= 3)),
  constraint referral_commissions_source_transaction_id_fkey foreign key (source_transaction_id) references public.transactions(id) on delete cascade,
  constraint referral_commissions_source_transaction_id_user_id_level_key unique (source_transaction_id, user_id, level),
  constraint referral_commissions_source_user_id_fkey foreign key (source_user_id) references public.profiles(id) on delete cascade,
  constraint referral_commissions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);

create table public.referral_rewards (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  tier text not null,
  referrals_required integer not null,
  amount numeric not null,
  created_at timestamp with time zone not null default now(),
  constraint referral_rewards_pkey primary key (id),
  constraint referral_rewards_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint referral_rewards_user_id_tier_key unique (user_id, tier)
);

create table public.referral_withdrawal_uses (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  referral_user_id uuid not null,
  withdrawal_transaction_id uuid,
  created_at timestamp with time zone not null default now(),
  constraint referral_withdrawal_uses_pkey primary key (id),
  constraint referral_withdrawal_uses_referral_user_id_fkey foreign key (referral_user_id) references public.profiles(id) on delete cascade,
  constraint referral_withdrawal_uses_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint referral_withdrawal_uses_user_id_referral_user_id_key unique (user_id, referral_user_id),
  constraint referral_withdrawal_uses_withdrawal_transaction_id_fkey foreign key (withdrawal_transaction_id) references public.transactions(id) on delete set null
);

create table public.settings (
  id text not null,
  jazzcash_number text,
  jazzcash_name text,
  easypaisa_number text,
  easypaisa_name text,
  referral_bonus_percent numeric not null default 5,
  usdt_bsc_address text,
  usdt_opbnb_address text,
  usdt_polygon_address text,
  usdt_trc20_address text,
  constraint settings_pkey primary key (id)
);

create table public.vip_reward_claims (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  tier text not null,
  referrals_required integer not null,
  reward_amount numeric not null,
  status text not null default 'unlocked'::text,
  unlocked_at timestamp with time zone not null default now(),
  constraint vip_reward_claims_pkey primary key (id),
  constraint vip_reward_claims_status_check check (status = any (array['unlocked'::text, 'approved'::text, 'paid'::text])),
  constraint vip_reward_claims_tier_check check (tier = any (array['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text, 'diamond'::text])),
  constraint vip_reward_claims_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint vip_reward_claims_user_id_tier_key unique (user_id, tier)
);

create table public.admin_impersonation_audit (
  id uuid not null default gen_random_uuid(),
  admin_user_id uuid not null,
  target_user_id uuid not null,
  action text not null,
  created_at timestamp with time zone not null default now(),
  constraint admin_impersonation_audit_pkey primary key (id),
  constraint admin_impersonation_audit_action_check check (action = any (array['start'::text, 'stop'::text])),
  constraint admin_impersonation_audit_admin_user_id_fkey foreign key (admin_user_id) references public.profiles(id) on delete restrict,
  constraint admin_impersonation_audit_target_user_id_fkey foreign key (target_user_id) references public.profiles(id) on delete restrict
);

create table public.platform_migrations (
  key text not null,
  applied_at timestamp with time zone not null default now(),
  constraint platform_migrations_pkey primary key (key)
);

create index admin_impersonation_audit_created_idx on public.admin_impersonation_audit using btree (created_at desc);
create index investments_status_idx on public.investments using btree (status);
create index investments_user_id_idx on public.investments using btree (user_id);
create index referral_commissions_user_idx on public.referral_commissions using btree (user_id);
create unique index referral_withdrawal_transaction_unique on public.referral_withdrawal_uses using btree (withdrawal_transaction_id);
create index referral_withdrawal_uses_user_idx on public.referral_withdrawal_uses using btree (user_id);
create index transactions_type_idx on public.transactions using btree (type);
create index transactions_user_id_idx on public.transactions using btree (user_id);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = 'public'
as $function$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_code text;
begin
  v_code := upper(substr(md5(new.id::text), 1, 8));
  insert into public.profiles (id, name, username, email, phone, country, referral_code, referred_by, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'username',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'country', 'Pakistan'),
    v_code,
    new.raw_user_meta_data ->> 'referred_by',
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

create or replace function public.referral_active_level1_count(p_user_id uuid)
returns integer
language sql
security definer
set search_path = 'public'
as $function$
  select count(*)::integer from (
    select distinct p.id
    from public.profiles p
    join public.transactions t on t.user_id = p.id
    where p.referred_by = (select referral_code from public.profiles where id = p_user_id)
      and lower(t.type) = 'deposit'
      and lower(t.status) in ('approved', 'completed', 'success')
  ) active;
$function$;

create or replace function public.has_available_active_referral()
returns boolean
language sql
security definer
set search_path = 'public'
as $function$
  select public.referral_active_level1_count(auth.uid()) * 3 >
    (select count(*) from public.referral_withdrawal_uses where user_id = auth.uid());
$function$;

create or replace function public.claim_active_referral_for_withdrawal()
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller uuid := auth.uid();
  selected_referral uuid;
begin
  if caller is null then raise exception 'Not authenticated'; end if;
  select p.id into selected_referral
  from public.profiles p
  where p.referred_by = (select referral_code from public.profiles where id = caller)
    and exists (
      select 1 from public.transactions t
      where t.user_id = p.id and t.type = 'deposit' and t.status = 'approved'
    )
    and not exists (
      select 1 from public.referral_withdrawal_uses u
      where u.user_id = caller and u.referral_user_id = p.id
    )
  order by p.created_at
  for update skip locked
  limit 1;
  if selected_referral is null then return null; end if;
  insert into public.referral_withdrawal_uses(user_id, referral_user_id) values (caller, selected_referral);
  return selected_referral;
end;
$function$;

create or replace function public.claim_active_referral_for_withdrawal(p_withdrawal_transaction_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  caller uuid := auth.uid();
  caller_code text;
  used_count integer;
  active_count integer;
  selected_referral uuid;
begin
  if caller is null then raise exception 'Not authenticated'; end if;
  select referral_code into caller_code from public.profiles where id = caller;
  select count(*) into used_count from public.referral_withdrawal_uses where user_id = caller;
  select public.referral_active_level1_count(caller) into active_count;
  if used_count >= active_count * 3 then return null; end if;
  select p.id into selected_referral
  from public.profiles p
  where p.referred_by = caller_code
    and exists (
      select 1 from public.transactions t
      where t.user_id = p.id and lower(t.type) = 'deposit'
        and lower(t.status) in ('approved', 'completed', 'success')
    )
  order by p.created_at, p.id
  offset floor(used_count / 3)::integer limit 1;
  if selected_referral is null then return null; end if;
  insert into public.referral_withdrawal_uses(user_id, referral_user_id, withdrawal_transaction_id)
  values (caller, selected_referral, p_withdrawal_transaction_id);
  return selected_referral;
end;
$function$;

create or replace function public.sync_vip_rewards(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  active_count integer;
  tier_row record;
begin
  active_count := public.referral_active_level1_count(p_user_id);
  for tier_row in
    select * from (values
      ('bronze', 5, 1000::numeric), ('silver', 15, 3000::numeric),
      ('gold', 30, 7000::numeric), ('platinum', 50, 15000::numeric),
      ('diamond', 100, 350000::numeric)
    ) x(tier, required, amount)
  loop
    if active_count >= tier_row.required then
      insert into public.referral_rewards(user_id, tier, referrals_required, amount)
      values (p_user_id, tier_row.tier, tier_row.required, tier_row.amount)
      on conflict do nothing;
      if found then
        update public.profiles
        set wallet_balance = wallet_balance + tier_row.amount,
            total_profit = total_profit + tier_row.amount,
            referral_earnings = referral_earnings + tier_row.amount
        where id = p_user_id;
        insert into public.transactions(user_id, type, amount, status, description)
        values (p_user_id, 'referral_reward', tier_row.amount, 'completed', initcap(tier_row.tier) || ' referral reward');
      end if;
    end if;
  end loop;
end;
$function$;

create or replace function public.submit_withdrawal_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_account_number text,
  p_fee_amount numeric,
  p_net_amount numeric,
  p_withdrawal_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_current_balance numeric;
  v_withdrawal_id uuid;
  v_payment_method text := nullif(btrim(p_payment_method), '');
  v_account_number text := nullif(btrim(p_account_number), '');
  v_fee_usdt numeric;
  v_fee_amount numeric;
  v_net_amount numeric;
begin
  if auth.uid() is null or p_user_id is null or auth.uid() <> p_user_id then
    raise exception 'Not authenticated';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Withdrawal amount must be positive.';
  end if;
  if v_payment_method is null or v_payment_method not in ('USDT-BSC', 'USDT-opBNB', 'USDT-POL', 'USDT-TRC20') then
    raise exception 'Select a valid payment method.';
  end if;
  if v_account_number is null then
    raise exception 'Enter your account number.';
  end if;
  select p.wallet_balance into v_current_balance
  from public.profiles p where p.id = p_user_id for update;
  if not found then raise exception 'Profile not found.'; end if;
  if v_current_balance is null or p_amount > v_current_balance then
    raise exception 'Insufficient balance.';
  end if;
  v_fee_usdt := case v_payment_method
    when 'USDT-BSC' then 0.01
    when 'USDT-opBNB' then 0.015
    when 'USDT-POL' then 0.03
    when 'USDT-TRC20' then 1.5
  end;
  v_fee_amount := round(v_fee_usdt * 280 * 100) / 100;
  v_net_amount := greatest(0, round((p_amount - v_fee_amount) * 100) / 100);
  update public.profiles set wallet_balance = wallet_balance - p_amount where id = p_user_id;
  insert into public.transactions (
    user_id, type, amount, original_amount, fee_amount, net_amount,
    withdrawal_date, status, payment_method, account_number, description
  ) values (
    p_user_id, 'withdrawal', p_amount, p_amount, v_fee_amount, v_net_amount,
    current_date, 'pending', v_payment_method, v_account_number, 'Withdrawal request'
  ) returning id into v_withdrawal_id;
  return v_withdrawal_id;
end;
$function$;

revoke all on function public.submit_withdrawal_atomic(uuid, numeric, text, text, numeric, numeric, date) from public, anon;
grant execute on function public.submit_withdrawal_atomic(uuid, numeric, text, text, numeric, numeric, date) to authenticated, service_role;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.admin_impersonation_audit enable row level security;
alter table public.investments enable row level security;
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.referral_commissions enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.referral_withdrawal_uses enable row level security;
alter table public.settings enable row level security;
alter table public.transactions enable row level security;
alter table public.vip_reward_claims enable row level security;

create policy admin_impersonation_audit_admin_select on public.admin_impersonation_audit for select using (public.is_admin());
create policy inv_insert on public.investments for insert with check (auth.uid() = user_id);
create policy inv_select on public.investments for select using ((auth.uid() = user_id) or public.is_admin());
create policy inv_update on public.investments for update using ((auth.uid() = user_id) or public.is_admin());
create policy plans_select on public.plans for select using (true);
create policy plans_write on public.plans for all using (public.is_admin()) with check (public.is_admin());
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_select_own on public.profiles for select using ((auth.uid() = id) or public.is_admin());
create policy profiles_update_own on public.profiles for update using ((auth.uid() = id) or public.is_admin());
create policy referral_commissions_own_select on public.referral_commissions for select to authenticated using (((select auth.uid()) = user_id) or public.is_admin());
create policy referral_rewards_select_own on public.referral_rewards for select to authenticated using (((select auth.uid()) = user_id) or public.is_admin());
create policy referral_withdrawal_uses_own_select on public.referral_withdrawal_uses for select using ((auth.uid() = user_id) or public.is_admin());
create policy settings_select on public.settings for select using (auth.role() = 'authenticated');
create policy settings_write on public.settings for all using (public.is_admin()) with check (public.is_admin());
create policy tx_insert on public.transactions for insert with check (auth.uid() = user_id);
create policy tx_select on public.transactions for select using ((auth.uid() = user_id) or public.is_admin());
create policy tx_update_admin on public.transactions for update using (public.is_admin());
create policy vip_reward_claims_select_own on public.vip_reward_claims for select to authenticated using (((select auth.uid()) = user_id) or public.is_admin());

insert into public.settings (id) values ('global') on conflict (id) do nothing;
