-- =====================================================================
-- 香港社區時間銀行 (Time Bank) — 初始資料庫結構
-- 適用：Supabase (PostgreSQL + Auth + RLS)
--
-- 資料表：
--   1. user_profiles        用戶檔案（長者 / 家屬 / 義工）
--   2. tasks                互助任務（需求）
--   3. time_credit_ledger   時間信用流水帳本（不可篡改，只增不刪）
--   4. community_pools      愛心公池（當前儲備餘額）
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 列舉型別 (ENUM)
-- ---------------------------------------------------------------------
create type public.user_role as enum ('ELDERLY', 'FAMILY_CARER', 'VOLUNTEER');

create type public.task_status as enum ('OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED');

create type public.funding_type as enum (
  'SELF_CREDIT',
  'OVERDRAFT',
  'COMMUNITY_POOL',
  'PURE_VOLUNTEER'
);

create type public.ledger_category as enum (
  'SIGNUP_GRANT',
  'TASK_EARN',
  'TASK_SPEND',
  'OVERDRAFT_SPEND',
  'POOL_DONATION',
  'POOL_SUBSIDY',
  'FAMILY_TRANSFER'
);

-- ---------------------------------------------------------------------
-- 1. user_profiles
-- ---------------------------------------------------------------------
create table public.user_profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              public.user_role not null default 'ELDERLY',
  display_name      text,
  phone_number      text,
  credit_balance    numeric(12, 2) not null default 10.0,
  credit_line       numeric(12, 2) not null default 10.0,
  linked_elderly_id uuid references public.user_profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.user_profiles is '用戶檔案：長者 / 家屬 / 義工';
comment on column public.user_profiles.credit_balance is '時間信用餘額，預設 10.0（長者迎新贈送）';
comment on column public.user_profiles.credit_line is '長者透支信用額度，預設 10.0';
comment on column public.user_profiles.linked_elderly_id is '家屬綁定的長者 user_profiles.id';

-- ---------------------------------------------------------------------
-- 2. tasks
-- ---------------------------------------------------------------------
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  creator_id        uuid not null references public.user_profiles (id) on delete cascade,
  volunteer_id      uuid references public.user_profiles (id) on delete set null,
  category          text not null,
  title             text not null,
  description       text,
  district          text not null,
  approx_location   text,
  exact_address     text,
  contact_name      text,
  contact_phone     text,
  scheduled_at      timestamptz,
  duration_minutes  integer,
  time_credits_cost numeric(12, 2) not null default 0,
  status            public.task_status not null default 'OPEN',
  funding_type      public.funding_type not null default 'SELF_CREDIT',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.tasks is '互助任務 / 需求';
comment on column public.tasks.category is '任務分類（見 constants/hongkong.ts）';
comment on column public.tasks.district is '香港 18 區';
comment on column public.tasks.approx_location is '粗略公開地點';
comment on column public.tasks.exact_address is '詳細私隱地址（僅發佈者與已配對義工可透過受控 API 取得）';

-- ---------------------------------------------------------------------
-- 3. time_credit_ledger（不可篡改流水帳本）
-- ---------------------------------------------------------------------
create table public.time_credit_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.user_profiles (id) on delete cascade,
  task_id    uuid references public.tasks (id) on delete set null,
  amount     numeric(12, 2) not null,
  category   public.ledger_category not null,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.time_credit_ledger is '時間信用流水帳本（不可篡改，只增不刪）';

-- ---------------------------------------------------------------------
-- 4. community_pools
-- ---------------------------------------------------------------------
create table public.community_pools (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  balance    numeric(12, 2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.community_pools is '愛心公池 — 記錄當前儲備餘額';

-- ---------------------------------------------------------------------
-- 索引 (Indexes)
-- ---------------------------------------------------------------------
create index idx_tasks_status on public.tasks (status);
create index idx_tasks_district on public.tasks (district);
create index idx_tasks_category on public.tasks (category);
create index idx_tasks_creator_id on public.tasks (creator_id);
create index idx_tasks_volunteer_id on public.tasks (volunteer_id);

create index idx_ledger_user_id on public.time_credit_ledger (user_id);
create index idx_ledger_task_id on public.time_credit_ledger (task_id);
create index idx_ledger_created_at on public.time_credit_ledger (created_at);

-- ---------------------------------------------------------------------
-- 自動更新 updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger trg_community_pools_updated_at
  before update on public.community_pools
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 帳本不可篡改：禁止 UPDATE / DELETE（如需更正請以反向分錄處理）
-- ---------------------------------------------------------------------
create or replace function public.ledger_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception '時間信用帳本為不可篡改流水，禁止 % 操作；如需更正請以反向分錄處理。', tg_op;
end;
$$;

create trigger trg_ledger_no_update
  before update on public.time_credit_ledger
  for each row execute function public.ledger_immutable();

create trigger trg_ledger_no_delete
  before delete on public.time_credit_ledger
  for each row execute function public.ledger_immutable();

-- ---------------------------------------------------------------------
-- 家屬是否綁定指定長者（security definer，避免 RLS 遞迴）
-- ---------------------------------------------------------------------
create or replace function public.is_linked_carer(target_elderly_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and linked_elderly_id = target_elderly_id
  );
$$;

-- ---------------------------------------------------------------------
-- 新用戶註冊時自動建立 profile 並記錄迎新贈送
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := 'ELDERLY';
begin
  if new.raw_user_meta_data ? 'role' then
    begin
      v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
    exception when others then
      v_role := 'ELDERLY';
    end;
  end if;

  insert into public.user_profiles (id, role, display_name, phone_number)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone_number'
  );

  -- 迎新贈送：與 credit_balance 預設 10.0 一致（如需僅限長者，可在此加入 role 判斷）
  insert into public.time_credit_ledger (user_id, amount, category, note)
  values (new.id, 10.0, 'SIGNUP_GRANT', '迎新贈送');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 啟用 RLS
-- ---------------------------------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.time_credit_ledger enable row level security;
alter table public.community_pools enable row level security;

-- ---------------------------------------------------------------------
-- RLS 政策
-- ---------------------------------------------------------------------

-- user_profiles：本人可讀取與更新；家屬可讀取綁定的長者
create policy "profiles_select_own" on public.user_profiles
  for select using (auth.uid() = id);

create policy "profiles_select_linked_elderly" on public.user_profiles
  for select using (public.is_linked_carer(id));

create policy "profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- tasks：所有已登入用戶可瀏覽；發佈者/義工可更新；發佈者可刪除
create policy "tasks_select_authenticated" on public.tasks
  for select using (auth.uid() is not null);

create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = creator_id);

create policy "tasks_update_participants" on public.tasks
  for update using (auth.uid() = creator_id or auth.uid() = volunteer_id)
  with check (auth.uid() = creator_id or auth.uid() = volunteer_id);

create policy "tasks_delete_creator" on public.tasks
  for delete using (auth.uid() = creator_id);

-- time_credit_ledger：僅本人可讀；寫入經 security definer 函數 / service_role
create policy "ledger_select_own" on public.time_credit_ledger
  for select using (auth.uid() = user_id);

-- community_pools：所有已登入用戶可讀；寫入僅 service_role
create policy "pools_select_authenticated" on public.community_pools
  for select using (auth.uid() is not null);

-- ---------------------------------------------------------------------
-- 權限授予
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select on public.time_credit_ledger to authenticated;
grant select on public.community_pools to authenticated;

-- 未來於 public schema 建立的物件亦自動授予
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 種子資料
-- ---------------------------------------------------------------------
-- 愛心公池：初始儲備餘額為 0
insert into public.community_pools (name, balance)
values ('愛心公池', 0.0)
on conflict (name) do nothing;


