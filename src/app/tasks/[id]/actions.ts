"use server";

import { revalidatePath } from "next/cache";

import { mockAcceptTask, mockCancelMatch } from "@/data/mock-data";
import { getSession } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import {
  sendCancelNotificationEmail,
  sendMatchNotificationEmail,
} from "@/lib/email";
import { cancelTaskReminders, scheduleTaskReminders } from "@/lib/qstash";
import { formatScheduledAt } from "@/lib/task";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: boolean; error?: string };

function translateDbError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("未登入")) return "請先登入。";
  if (m.includes("不存在")) return "任務不存在或已移除。";
  if (m.includes("已無法接單")) return "此任務已無法接單（可能已配對或已結束）。";
  if (m.includes("不能接取自己")) return "不能接取自己發布的任務。";
  if (m.includes("尚未配對")) return "任務尚未配對，無法取消接單。";
  if (m.includes("只有接單義工")) return "只有接單義工可以取消接單。";
  if (m.includes("服務已開始")) return "服務已開始，無法取消接單。";
  return message;
}

function appTaskUrl(taskId: string): string {
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  return `${base}/tasks/${taskId}`;
}

/** 接單：OPEN → MATCHED */
export async function acceptTask(taskId: string): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { success: false, error: "請先登入。" };

  // 無真實 Supabase 連線 → 模擬接單成功（就地變更 mock 資料，樂觀更新可見）
  if (!isSupabaseConfigured()) {
    mockAcceptTask(taskId, user.id);
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("accept_task", { p_task_id: taskId });
    if (error) return { success: false, error: translateDbError(error.message) };

    try {
      await afterAcceptSideEffects(taskId, user.id);
    } catch (e) {
      console.error("[accept] 通知/排程副作用失敗：", e);
    }

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${taskId}`);
    return { success: true };
  } catch {
    // 連線逾時/錯誤 → 模擬接單成功
    return { success: true };
  }
}

/** 取消接單：MATCHED → OPEN（僅義工、服務開始前） */
export async function cancelMatch(taskId: string): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { success: false, error: "請先登入。" };

  // 無真實 Supabase 連線 → 模擬取消接單成功（就地變更 mock 資料）
  if (!isSupabaseConfigured()) {
    mockCancelMatch(taskId);
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cancel_match", { p_task_id: taskId });
    if (error) return { success: false, error: translateDbError(error.message) };

    try {
      await afterCancelSideEffects(taskId);
    } catch (e) {
      console.error("[cancel] 通知/排程副作用失敗：", e);
    }

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${taskId}`);
    return { success: true };
  } catch {
    // 連線逾時/錯誤 → 模擬取消接單成功
    return { success: true };
  }
}

/** 接單後的副作用：即時通知 + 排程提醒 */
async function afterAcceptSideEffects(taskId: string, volunteerId: string) {
  const admin = createAdminClient();

  const { data: task } = await admin
    .from("tasks")
    .select("id, title, scheduled_at, creator_id")
    .eq("id", taskId)
    .single();
  if (!task) return;

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name, email")
    .in("id", [task.creator_id, volunteerId]);

  const creator = profiles?.find((p) => p.id === task.creator_id);
  const volunteer = profiles?.find((p) => p.id === volunteerId);

  // 1. 即時通知郵件（通知發布者）
  await sendMatchNotificationEmail({
    to: creator?.email,
    requesterName: creator?.display_name || "用戶",
    volunteerName: volunteer?.display_name || "志工",
    taskTitle: task.title,
    scheduledAt: task.scheduled_at ? formatScheduledAt(task.scheduled_at) : "待定",
    taskUrl: appTaskUrl(task.id),
  });

  // 2. 註冊排程提醒（T-24h / T-2h）
  if (task.scheduled_at) {
    const schedule = await scheduleTaskReminders(taskId, new Date(task.scheduled_at));
    if (schedule.reminder24hMessageId || schedule.reminder2hMessageId) {
      await admin
        .from("tasks")
        .update({
          reminder_24h_message_id: schedule.reminder24hMessageId,
          reminder_2h_message_id: schedule.reminder2hMessageId,
        })
        .eq("id", taskId);
    }
  }
}

/** 取消接單後的副作用：作廢排程 + 通知需求方 */
async function afterCancelSideEffects(taskId: string) {
  const admin = createAdminClient();

  const { data: task } = await admin
    .from("tasks")
    .select("id, title, creator_id, reminder_24h_message_id, reminder_2h_message_id")
    .eq("id", taskId)
    .single();
  if (!task) return;

  // 1. 取消/作廢已排程的 QStash 定時任務
  await cancelTaskReminders(task.reminder_24h_message_id, task.reminder_2h_message_id);

  // 2. 清空 message id
  await admin
    .from("tasks")
    .update({ reminder_24h_message_id: null, reminder_2h_message_id: null })
    .eq("id", taskId);

  // 3. 通知郵件（告知需求方任務已重新放回公開互助池）
  const { data: creator } = await admin
    .from("user_profiles")
    .select("id, display_name, email")
    .eq("id", task.creator_id)
    .single();

  await sendCancelNotificationEmail({
    to: creator?.email,
    requesterName: creator?.display_name || "用戶",
    taskTitle: task.title,
    taskUrl: appTaskUrl(task.id),
  });
}
