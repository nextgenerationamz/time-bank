"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  buildTaskDescription,
  buildTaskTitle,
  combineDateTime,
  durationToCredits,
  type PublishContext,
  type PublishResult,
} from "@/lib/task";
import {
  publishTaskSchema,
  type PublishTaskInput,
} from "@/lib/validations/task";

function firstError(error: ZodError): string {
  return error.issues[0]?.message ?? "資料格式不正確";
}

/** 讀取發布者當前可用積分、透支額度與基本資料（供表單預填與發布方式判斷） */
export async function getPublishContext(): Promise<PublishContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      displayName: null,
      phoneNumber: null,
      creditBalance: 0,
      creditLine: 0,
    };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, phone_number, credit_balance, credit_line")
    .eq("id", user.id)
    .maybeSingle();

  return {
    authenticated: true,
    displayName: profile?.display_name ?? null,
    phoneNumber: profile?.phone_number ?? null,
    creditBalance: Number(profile?.credit_balance ?? 0),
    creditLine: Number(profile?.credit_line ?? 10),
  };
}

/** 發布需求：驗證 → 計算積分 → 交由 security definer RPC 原子寫入 */
export async function publishTask(input: PublishTaskInput): Promise<PublishResult> {
  const parsed = publishTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed.error) };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "請先登入後再發布需求。" };
  }

  const scheduledAt = combineDateTime(data.date, data.startTime);
  if (!scheduledAt) {
    return { success: false, error: "預約日期或時間格式不正確。" };
  }
  if (scheduledAt.getTime() <= Date.now()) {
    return { success: false, error: "預約時間必須為未來時間，請重新選擇。" };
  }

  const cost = durationToCredits(data.durationMinutes);
  const title = buildTaskTitle(data.category, data.district);
  const description = buildTaskDescription(
    data.category,
    data.date,
    data.startTime,
    data.approxLocation
  );

  // 信用核實與帳本寫入交由 security definer RPC 以單一交易完成
  const { data: taskId, error } = await supabase.rpc("publish_task", {
    p_category: data.category,
    p_title: title,
    p_description: description,
    p_district: data.district,
    p_approx_location: data.approxLocation,
    p_exact_address: data.exactAddress,
    p_contact_name: data.contactName,
    p_contact_phone: data.contactPhone,
    p_scheduled_at: scheduledAt.toISOString(),
    p_duration_minutes: data.durationMinutes,
    p_time_credits_cost: cost,
    p_funding_type: data.fundingType,
  });

  if (error) {
    return { success: false, error: translateDbError(error.message) };
  }

  revalidatePath("/tasks");
  revalidatePath("/wallet");
  return { success: true, taskId: taskId as string };
}

function translateDbError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("可用積分不足")) return "可用積分不足，無法發布此需求。";
  if (m.includes("透支")) return "已超出長者信用透支額度，請選擇公池資助或純義工發布。";
  if (m.includes("公池")) return "愛心公池餘額不足，暫未能資助此需求。";
  if (m.includes("未登入")) return "請先登入後再發布需求。";
  if (m.includes("不存在")) return "用戶檔案不存在，請先完成個人資料設定。";
  return message;
}
