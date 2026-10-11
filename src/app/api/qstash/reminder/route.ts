import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";

import { sendTaskReminderEmail } from "@/lib/email";
import { formatScheduledAt } from "@/lib/task";
import { createAdminClient } from "@/lib/supabase/admin";

type ReminderPayload = {
  taskId?: string;
  reminderType?: "t24h" | "t2h";
};

async function verifySignature(
  request: NextRequest,
  rawBody: string
): Promise<boolean> {
  // 未設定簽署金鑰（例如本機開發）時略過驗證
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY) {
    return true;
  }

  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });
    const signature = request.headers.get("upstash-signature");
    if (!signature) return false;
    return await receiver.verify({ signature, body: rawBody });
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!(await verifySignature(request, rawBody))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: ReminderPayload;
  try {
    payload = JSON.parse(rawBody) as ReminderPayload;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { taskId, reminderType } = payload;
  if (!taskId || (reminderType !== "t24h" && reminderType !== "t2h")) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: task } = await admin
      .from("tasks")
      .select("id, title, scheduled_at, status, creator_id, volunteer_id")
      .eq("id", taskId)
      .single();

    // 任務已取消、已完成、不存在，或服務時間已過，則不再發送提醒
    if (!task || task.status !== "MATCHED") {
      return NextResponse.json({ ok: true, skipped: true });
    }
    if (!task.scheduled_at || new Date(task.scheduled_at).getTime() <= Date.now()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { data: users } = await admin
      .from("user_profiles")
      .select("id, display_name, email, phone_number")
      .in("id", [task.creator_id, task.volunteer_id].filter(Boolean) as string[]);

    const creator = users?.find((u) => u.id === task.creator_id);
    const volunteer = users?.find((u) => u.id === task.volunteer_id);

    const appUrl = process.env.APP_URL ?? "";
    const hoursBefore = reminderType === "t24h" ? 24 : 2;
    const taskUrl = `${appUrl.replace(/\/$/, "")}/tasks/${task.id}`;

    // 發送提醒給雙方（T-2h 附一鍵 WhatsApp 聯絡連結）
    for (const recipient of [creator, volunteer]) {
      if (!recipient) continue;
      const otherParty = recipient.id === task.creator_id ? volunteer : creator;

      await sendTaskReminderEmail({
        to: recipient.email,
        recipientName: recipient.display_name || "用戶",
        otherPartyName: otherParty?.display_name || "對方",
        otherPartyPhone: otherParty?.phone_number ?? "",
        taskTitle: task.title,
        scheduledAt: formatScheduledAt(task.scheduled_at),
        hoursBefore,
        taskUrl,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[qstash-reminder] 處理提醒失敗：", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
