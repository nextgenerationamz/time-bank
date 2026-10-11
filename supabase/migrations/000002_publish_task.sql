-- =====================================================================
-- 香港社區時間銀行 — 發布互助需求
-- 新增 security definer 函數 public.publish_task：
--   以單一交易原子完成「信用核實 → 扣減/凍結 → 寫入任務 → 寫入帳本」。
-- 帳本為不可篡改流水，信用變動一律經由此函數（或 service_role）進行，
-- 一般用戶無法直接寫入 time_credit_ledger。
-- =====================================================================

create or replace function public.publish_task(
  p_category text,
  p_title text,
  p_description text,
  p_district text,
  p_approx_location text,
  p_exact_address text,
  p_contact_name text,
  p_contact_phone text,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_time_credits_cost numeric,
  p_funding_type public.funding_type
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_credit_line numeric;
  v_pool_id uuid;
  v_pool_balance numeric;
  v_task_id uuid;
begin
  if v_user_id is null then
    raise exception '未登入';
  end if;

  -- 讀取用戶餘額與透支額度（鎖定避免並發重複扣減）
  select credit_balance, credit_line
    into v_balance, v_credit_line
    from public.user_profiles
   where id = v_user_id
     for update;

  if v_balance is null then
    raise exception '用戶檔案不存在，無法發布需求';
  end if;

  -- 依資金來源執行信用處理
  case p_funding_type
    when 'SELF_CREDIT' then
      if v_balance < p_time_credits_cost then
        raise exception '可用積分不足';
      end if;
      update public.user_profiles
         set credit_balance = credit_balance - p_time_credits_cost
       where id = v_user_id;

    when 'OVERDRAFT' then
      if v_balance + v_credit_line < p_time_credits_cost then
        raise exception '超出長者信用透支額度';
      end if;
      update public.user_profiles
         set credit_balance = credit_balance - p_time_credits_cost
       where id = v_user_id;

    when 'COMMUNITY_POOL' then
      select id, balance
        into v_pool_id, v_pool_balance
        from public.community_pools
       where name = '愛心公池'
       order by created_at
       limit 1
         for update;

      if v_pool_id is null then
        raise exception '尚未設定愛心公池';
      end if;
      if v_pool_balance < p_time_credits_cost then
        raise exception '愛心公池餘額不足';
      end if;

      update public.community_pools
         set balance = balance - p_time_credits_cost
       where id = v_pool_id;

    when 'PURE_VOLUNTEER' then
      null; -- 純義工，不涉及信用

    else
      raise exception '無效的資金來源';
  end case;

  -- 寫入任務
  insert into public.tasks (
    creator_id, category, title, description, district,
    approx_location, exact_address, contact_name, contact_phone,
    scheduled_at, duration_minutes, time_credits_cost, status, funding_type
  ) values (
    v_user_id, p_category, p_title, p_description, p_district,
    p_approx_location, p_exact_address, p_contact_name, p_contact_phone,
    p_scheduled_at, p_duration_minutes, p_time_credits_cost, 'OPEN', p_funding_type
  )
  returning id into v_task_id;

  -- 寫入時間信用帳本（發布紀錄）
  -- 帳本金額慣例：正數 = 入帳，負數 = 出帳。
  case p_funding_type
    when 'SELF_CREDIT' then
      insert into public.time_credit_ledger (user_id, task_id, amount, category, note)
      values (v_user_id, v_task_id, -p_time_credits_cost, 'TASK_SPEND', '發布需求扣除時間信用');

    when 'OVERDRAFT' then
      insert into public.time_credit_ledger (user_id, task_id, amount, category, note)
      values (v_user_id, v_task_id, -p_time_credits_cost, 'OVERDRAFT_SPEND', '長者信用透支額度發布');

    when 'COMMUNITY_POOL' then
      -- 公池補貼記為正數入帳（長者獲得資助，實際扣減反映於 community_pools.balance）
      insert into public.time_credit_ledger (user_id, task_id, amount, category, note)
      values (v_user_id, v_task_id, p_time_credits_cost, 'POOL_SUBSIDY', '愛心公池資助發布');

    else
      null; -- PURE_VOLUNTEER 不涉及信用，不寫帳本
  end case;

  return v_task_id;
end;
$$;

-- 僅允許已登入用戶呼叫；避免匿名角色執行
revoke all on function public.publish_task(text, text, text, text, text, text, text, text, timestamptz, integer, numeric, public.funding_type) from public;
grant execute on function public.publish_task(text, text, text, text, text, text, text, text, timestamptz, integer, numeric, public.funding_type) to authenticated;
