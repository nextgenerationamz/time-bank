import type { TaskCategory } from "@/constants/hongkong";

/** 1 小時 = 1.0 時間幣 */
export const TIME_CREDITS_PER_HOUR = 1.0;
export const MINUTES_PER_HOUR = 60;

/** 依服務時長換算所需時間幣 */
export function durationToCredits(durationMinutes: number): number {
  return (durationMinutes / MINUTES_PER_HOUR) * TIME_CREDITS_PER_HOUR;
}

/** 格式化時間幣（保留 1 位小數） */
export function formatCredits(credits: number): string {
  return `${credits.toFixed(1)} TC`;
}

/** 合併預約日期與開始時間 */
export function combineDateTime(date: string, time: string): Date | null {
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function buildTaskTitle(category: TaskCategory, district: string): string {
  return `${category}（${district}）`;
}

export function buildTaskDescription(
  category: TaskCategory,
  date: string,
  startTime: string,
  approxLocation: string
): string {
  return `於 ${date} ${startTime} 需要「${category}」服務，地點：${approxLocation}`;
}

/** 發布方式 */
export type FundingMode = "SELF_CREDIT" | "OVERDRAFT" | "CHOOSE";

/** 依餘額、透支額度與所需積分決定發布方式 */
export function determineFundingMode(
  balance: number,
  creditLine: number,
  cost: number
): FundingMode {
  if (balance >= cost) return "SELF_CREDIT";
  if (balance + creditLine >= cost) return "OVERDRAFT";
  return "CHOOSE";
}

export type PublishContext = {
  authenticated: boolean;
  displayName: string | null;
  phoneNumber: string | null;
  creditBalance: number;
  creditLine: number;
};

export type PublishResult =
  | { success: true; taskId: string }
  | { success: false; error: string };

/** 格式化服務時長 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分鐘`;
  const hours = minutes / 60;
  return `${hours} 小時`;
}

/** 格式化預約時間（以香港時區顯示） */
export function formatScheduledAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** 任務摘要（公開欄位） */
export type TaskSummary = {
  id: string;
  creator_id: string;
  volunteer_id: string | null;
  category: string;
  title: string;
  description: string | null;
  district: string;
  approx_location: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  time_credits_cost: number | string;
  status: string;
  funding_type: string;
  created_at: string;
  has_insurance_coverage: boolean;
  insurance_fee_hkd: number | string;
  enterprise_tag_id: string | null;
  enterprise_name: string | null;
};

/** 任務詳情（含私隱欄位，未授權時為 null） */
export type TaskDetail = TaskSummary & {
  exact_address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
};
