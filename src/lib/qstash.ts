import { Client } from "@upstash/qstash";

function getQstash(): Client | null {
  if (!process.env.QSTASH_TOKEN) {
    console.warn("[qstash] 未設定 QSTASH_TOKEN，略過排程。");
    return null;
  }
  return new Client({ token: process.env.QSTASH_TOKEN });
}

export type ReminderSchedule = {
  reminder24hMessageId: string | null;
  reminder2hMessageId: string | null;
};

/**
 * 註冊兩個排程 Webhook（T-24h 與 T-2h）。
 * 僅在延遲時間仍為正數（服務尚未臨近）時排程。
 */
export async function scheduleTaskReminders(
  taskId: string,
  scheduledAt: Date
): Promise<ReminderSchedule> {
  const result: ReminderSchedule = {
    reminder24hMessageId: null,
    reminder2hMessageId: null,
  };

  const qstash = getQstash();
  const baseUrl = process.env.APP_URL;
  if (!qstash || !baseUrl) return result;

  const now = Date.now();
  const target = scheduledAt.getTime();
  const delay24 = Math.floor((target - 24 * 60 * 60 * 1000 - now) / 1000);
  const delay2 = Math.floor((target - 2 * 60 * 60 * 1000 - now) / 1000);
  const url = `${baseUrl.replace(/\/$/, "")}/api/qstash/reminder`;

  if (delay24 > 0) {
    try {
      const { messageId } = await qstash.publishJSON({
        url,
        body: { taskId, reminderType: "t24h" },
        delay: delay24,
        retries: 2,
      });
      result.reminder24hMessageId = messageId;
    } catch (e) {
      console.error("[qstash] 排程 T-24h 提醒失敗：", e);
    }
  }

  if (delay2 > 0) {
    try {
      const { messageId } = await qstash.publishJSON({
        url,
        body: { taskId, reminderType: "t2h" },
        delay: delay2,
        retries: 2,
      });
      result.reminder2hMessageId = messageId;
    } catch (e) {
      console.error("[qstash] 排程 T-2h 提醒失敗：", e);
    }
  }

  return result;
}

/** 取消/作廢已排程的 QStash 定時任務 */
export async function cancelTaskReminders(
  reminder24hMessageId: string | null,
  reminder2hMessageId: string | null
): Promise<void> {
  const qstash = getQstash();
  if (!qstash) return;

  const ids = [reminder24hMessageId, reminder2hMessageId].filter(
    (id): id is string => Boolean(id)
  );
  if (ids.length === 0) return;

  try {
    await qstash.messages.cancel(ids);
  } catch (e) {
    console.error("[qstash] 取消排程提醒失敗：", e);
  }
}
