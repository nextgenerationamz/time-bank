import { render } from "@react-email/render";
import { Resend } from "resend";

import {
  CancelNotificationEmail,
  type CancelNotificationEmailProps,
} from "@/emails/cancel-notification";
import {
  MatchNotificationEmail,
  type MatchNotificationEmailProps,
} from "@/emails/match-notification";
import {
  TaskReminderEmail,
  type TaskReminderEmailProps,
} from "@/emails/task-reminder";

const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "香港社區時間銀行 <onboarding@resend.dev>";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] 未設定 RESEND_API_KEY，略過郵件發送。");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendEmail(
  to: string | null | undefined,
  subject: string,
  html: string
): Promise<void> {
  if (!to) {
    console.warn("[email] 收件人電郵缺失，略過發送。");
    return;
  }
  const resend = getResend();
  if (!resend) return;

  try {
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) {
      console.error("[email] 發送失敗：", error.message);
    }
  } catch (e) {
    console.error("[email] 發送異常：", e);
  }
}

/** 接單即時通知（通知需求方） */
export async function sendMatchNotificationEmail({
  to,
  ...rest
}: MatchNotificationEmailProps & { to: string | null | undefined }): Promise<void> {
  const html = await render(<MatchNotificationEmail {...rest} />);
  await sendEmail(to, "有志工接取了您的需求", html);
}

/** T-24h / T-2h 提醒（通知雙方） */
export async function sendTaskReminderEmail({
  to,
  ...rest
}: TaskReminderEmailProps & { to: string | null | undefined }): Promise<void> {
  const html = await render(<TaskReminderEmail {...rest} />);
  const subject =
    rest.hoursBefore === 2 ? "提提您：任務將於 2 小時後開始" : "提提您：任務將於明天進行";
  await sendEmail(to, subject, html);
}

/** 取消接單通知（通知需求方） */
export async function sendCancelNotificationEmail({
  to,
  ...rest
}: CancelNotificationEmailProps & { to: string | null | undefined }): Promise<void> {
  const html = await render(<CancelNotificationEmail {...rest} />);
  await sendEmail(to, "志工已取消接單", html);
}
