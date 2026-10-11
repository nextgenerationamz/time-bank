-- =====================================================================
-- 香港社區時間銀行 — 任務大廳 / 詳情 / 接單與取消
--   1. tasks_public     公開視圖（不含私隱欄位）
--   2. notifications    通知表
--   3. get_task_detail  詳情函數（依身份遮蔽私隱欄位）
--   4. accept_task / cancel_match 接單與取消函數
-- =====================================================================

-- ---------------------------------------------------------------------
-- 公開視圖：僅含公開欄位，私隱欄位（exact_address / contact_*）一律不外露
-- ---------------------------------------------------------------------
create or replace view public.tasks_public as
select
  id,
  creator_id,
  volunteer_id,
  category,
  title,
  description,
  district,
  approx_location,
  scheduled_at,
  duration_minutes,
  time_credits_cost,
  status,
  funding_type,
  created_at
from public.tasks;

-- ---------------------------------------------------------------------
-- 通知表
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.user_profiles (id) on delete cascade,
  task_id      uuid references public.tasks (id) on delete cascade,
  type         text not null,
  message      text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_notifications_recipient
  on public.notifications (recipient_id, is_read);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = recipient_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

grant select, update on public.notifications to authenticated;

-- ---------------------------------------------------------------------
-- 任務詳情：依身份遮蔽私隱欄位
-- （僅創建者或已接單義工可取回 exact_address / contact_name / contact_phone）
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
  created_at timestamptz
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
    t.created_at
  from public.tasks t
  where t.id = p_task_id;
$$;

-- ---------------------------------------------------------------------
-- 接單：OPEN → MATCHED，寫入 volunteer_id，並通知發布者
-- ---------------------------------------------------------------------
create or replace function public.accept_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks;
begin
  if v_user_id is null then
    raise exception '未登入';
  end if;

  select * into v_task from public.tasks where id = p_task_id for update;

  if v_task.id is null then
    raise exception '任務不存在';
  end if;
  if v_task.status <> 'OPEN' then
    raise exception '任務已無法接單';
  end if;
  if v_task.creator_id = v_user_id then
    raise exception '不能接取自己發布的任務';
  end if;

  update public.tasks
     set status = 'MATCHED', volunteer_id = v_user_id, updated_at = now()
   where id = p_task_id;

  insert into public.notifications (recipient_id, task_id, type, message)
  values (v_task.creator_id, p_task_id, 'TASK_MATCHED', '有義工接取了您的需求');
end;
$$;

-- ---------------------------------------------------------------------
-- 取消接單：MATCHED → OPEN（僅義工、且服務開始前），清空 volunteer_id
-- ---------------------------------------------------------------------
create or replace function public.cancel_match(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks;
begin
  if v_user_id is null then
    raise exception '未登入';
  end if;

  select * into v_task from public.tasks where id = p_task_id for update;

  if v_task.id is null then
    raise exception '任務不存在';
  end if;
  if v_task.status <> 'MATCHED' then
    raise exception '任務尚未配對';
  end if;
  if v_task.volunteer_id is distinct from v_user_id then
    raise exception '只有接單義工可以取消';
  end if;
  if v_task.scheduled_at is not null and v_task.scheduled_at <= now() then
    raise exception '服務已開始';
  end if;

  update public.tasks
     set status = 'OPEN', volunteer_id = null, updated_at = now()
   where id = p_task_id;

  insert into public.notifications (recipient_id, task_id, type, message)
  values (v_task.creator_id, p_task_id, 'TASK_CANCELLED', '義工已取消接單，需求重新開放');
end;
$$;

-- ---------------------------------------------------------------------
-- 權限：僅透過受控 API 讀取任務；私隱欄位只能經 get_task_detail 取得
-- ---------------------------------------------------------------------
revoke select on public.tasks from anon, authenticated;

grant select on public.tasks_public to authenticated;

grant execute on function public.get_task_detail(uuid) to authenticated;
grant execute on function public.accept_task(uuid) to authenticated;
grant execute on function public.cancel_match(uuid) to authenticated;

revoke execute on function public.get_task_detail(uuid) from public;
revoke execute on function public.accept_task(uuid) from public;
revoke execute on function public.cancel_match(uuid) from public;

