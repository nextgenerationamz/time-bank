-- =====================================================================
-- 香港社區時間銀行 — 郵件通知與排程提醒支援
--   1. user_profiles 加入 email（供郵件通知使用）
--   2. tasks 加入 reminder_24h_message_id / reminder_2h_message_id（QStash 排程）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. user_profiles 加入 email
-- ---------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists email text;

comment on column public.user_profiles.email is '用戶電郵（與 auth.users.email 同步）';

-- ---------------------------------------------------------------------
-- 2. 更新 handle_new_user：註冊時一併寫入 email
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

  insert into public.user_profiles (id, role, display_name, phone_number, email)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone_number',
    new.email
  );

  -- 迎新贈送：與 credit_balance 預設 10.0 一致（如需僅限長者，可在此加入 role 判斷）
  insert into public.time_credit_ledger (user_id, amount, category, note)
  values (new.id, 10.0, 'SIGNUP_GRANT', '迎新贈送');

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. 回溯既有用戶的 email
-- ---------------------------------------------------------------------
update public.user_profiles p
   set email = u.email
  from auth.users u
 where p.id = u.id
   and p.email is null;

-- ---------------------------------------------------------------------
-- 4. tasks 加入 QStash 排程訊息 ID（用於取消/作廢提醒）
-- ---------------------------------------------------------------------
alter table public.tasks
  add column if not exists reminder_24h_message_id text,
  add column if not exists reminder_2h_message_id text;
