-- =====================================================================
-- 香港社區時間銀行 — B2B 商業化與安全防護
--   1. enterprises 企業表（ESG CSR 贊助）
--   2. user_profiles 擴展（KYC 實名認證 + 企業關聯）
--   3. tasks 擴展（微型意外險 + 企業認領）
--   4. esg_service_logs ESG 服務紀錄
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. enterprises
-- ---------------------------------------------------------------------
create table if not exists public.enterprises (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  logo_url               text,
  sponsored_pool_credits numeric(12, 2) not null default 0,
  total_contributed_hkd  numeric(12, 2) not null default 0,
  created_at             timestamptz not null default now()
);

comment on table public.enterprises is '企業合作夥伴（ESG CSR 贊助）';
comment on column public.enterprises.sponsored_pool_credits is '贊助公池的時間幣額度';
comment on column public.enterprises.total_contributed_hkd is '累計捐款金額（港幣）';

-- ---------------------------------------------------------------------
-- 2. user_profiles 擴展
-- ---------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists verification_paid_at timestamptz,
  add column if not exists company_id uuid references public.enterprises (id) on delete set null;

comment on column public.user_profiles.is_verified is '是否已完成實名與背景審核';
comment on column public.user_profiles.verification_paid_at is '認證費付費時間';
comment on column public.user_profiles.company_id is '企業員工義工關聯的企業';

-- ---------------------------------------------------------------------
-- 3. tasks 擴展
-- ---------------------------------------------------------------------
alter table public.tasks
  add column if not exists has_insurance_coverage boolean not null default false,
  add column if not exists insurance_fee_hkd numeric(6, 2) not null default 0.00,
  add column if not exists enterprise_tag_id uuid references public.enterprises (id) on delete set null;

comment on column public.tasks.has_insurance_coverage is '是否啟用加值意外保障包';
comment on column public.tasks.insurance_fee_hkd is '加值保障包費用（港幣）';
comment on column public.tasks.enterprise_tag_id is '由特定企業認領的服務單';

-- ---------------------------------------------------------------------
-- 4. esg_service_logs
-- ---------------------------------------------------------------------
create table if not exists public.esg_service_logs (
  id                            uuid primary key default gen_random_uuid(),
  enterprise_id                 uuid not null references public.enterprises (id) on delete cascade,
  user_id                       uuid not null references public.user_profiles (id) on delete cascade,
  task_id                       uuid references public.tasks (id) on delete set null,
  service_hours                 numeric(6, 2) not null default 0,
  carbon_or_social_impact_score numeric(6, 2) not null default 0,
  created_at                    timestamptz not null default now()
);

comment on table public.esg_service_logs is '企業員工服務歷程（供 ESG 審計報告導出）';

create index if not exists idx_esg_logs_enterprise on public.esg_service_logs (enterprise_id);
create index if not exists idx_esg_logs_user on public.esg_service_logs (user_id);
create index if not exists idx_esg_logs_task on public.esg_service_logs (task_id);

-- ---------------------------------------------------------------------
-- 5. 更新 tasks_public 視圖（加入新欄位與企業名稱）
-- ---------------------------------------------------------------------
create or replace view public.tasks_public as
select
  t.id,
  t.creator_id,
  t.volunteer_id,
  t.category,
  t.title,
  t.description,
  t.district,
  t.approx_location,
  t.scheduled_at,
  t.duration_minutes,
  t.time_credits_cost,
  t.status,
  t.funding_type,
  t.created_at,
  t.has_insurance_coverage,
  t.insurance_fee_hkd,
  t.enterprise_tag_id,
  e.name as enterprise_name
from public.tasks t
left join public.enterprises e on e.id = t.enterprise_tag_id;

-- ---------------------------------------------------------------------
-- 6. 更新 get_task_detail（加入新欄位）
-- ---------------------------------------------------------------------
create or replace function public.get_task_detail(p_task_id uuid)
returns table (
  id uuid,
  creator_id uuid,
  volunteer_id uuid,
  category text,
  title text,
  description text,
  district text,
  approx_location text,
  exact_address text,
  contact_name text,
  contact_phone text,
  scheduled_at timestamptz,
  duration_minutes integer,
  time_credits_cost numeric,
  status public.task_status,
  funding_type public.funding_type,
  created_at timestamptz,
  has_insurance_coverage boolean,
  insurance_fee_hkd numeric,
  enterprise_tag_id uuid,
  enterprise_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.creator_id,
    t.volunteer_id,
    t.category,
    t.title,
    t.description,
    t.district,
    t.approx_location,
    case when auth.uid() = t.creator_id or auth.uid() = t.volunteer_id
         then t.exact_address else null end,
    case when auth.uid() = t.creator_id or auth.uid() = t.volunteer_id
         then t.contact_name else null end,
    case when auth.uid() = t.creator_id or auth.uid() = t.volunteer_id
         then t.contact_phone else null end,
    t.scheduled_at,
    t.duration_minutes,
    t.time_credits_cost,
    t.status,
    t.funding_type,
    t.created_at,
    t.has_insurance_coverage,
    t.insurance_fee_hkd,
    t.enterprise_tag_id,
    e.name
  from public.tasks t
  left join public.enterprises e on e.id = t.enterprise_tag_id
  where t.id = p_task_id;
$$;

-- ---------------------------------------------------------------------
-- 7. RLS 與權限
-- ---------------------------------------------------------------------
alter table public.enterprises enable row level security;

create policy "enterprises_select_authenticated" on public.enterprises
  for select using (auth.uid() is not null);

alter table public.esg_service_logs enable row level security;

-- 取得當前用戶所屬企業（security definer，避免 RLS 遞迴）
create or replace function public.get_my_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select company_id from public.user_profiles where id = auth.uid();
$$;

create policy "esg_logs_select_own_company" on public.esg_service_logs
  for select using (enterprise_id = public.get_my_company_id());

grant select on public.enterprises to authenticated;
grant select on public.esg_service_logs to authenticated;
grant execute on function public.get_my_company_id() to authenticated;
revoke execute on function public.get_my_company_id() from public;

