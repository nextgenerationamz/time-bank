// 香港社區時間銀行 (Time Bank) — 全域常數與香港分區定義
// 所有 UI 與文案一律使用繁體中文（香港日常用語）

/** 平台名稱 */
export const SITE_NAME = "香港社區時間銀行";
export const SITE_NAME_SHORT = "時間銀行";

/** 迎新贈送與透支額度（與資料庫 migration 預設值保持一致） */
export const SIGNUP_GRANT_CREDITS = 10.0;
export const DEFAULT_CREDIT_LINE = 10.0;

/** 志工實名認證費（港幣） */
export const KYC_VERIFICATION_FEE_HKD = 100;

/** 微型意外保障包單次費用（港幣） */
export const INSURANCE_FEE_HKD = 50;

/** 預設任務分類 */
export const DEFAULT_CATEGORIES = [
  "陪診就醫",
  "家居修繕",
  "數碼電子支援",
  "街市代購/取藥",
  "生活傾偈/伴聊",
] as const;

export type TaskCategory = (typeof DEFAULT_CATEGORIES)[number];

/** 香港 18 區 */
export const HK_18_DISTRICTS = [
  "中西區",
  "灣仔",
  "東區",
  "南區",
  "油尖旺",
  "深水埗",
  "九龍城",
  "黃大仙",
  "觀塘",
  "葵青",
  "荃灣",
  "屯門",
  "元朗",
  "北區",
  "大埔",
  "沙田",
  "西貢",
  "離島",
] as const;

export type HongKongDistrict = (typeof HK_18_DISTRICTS)[number];

/** 用戶角色（對應資料庫 user_role enum） */
export const USER_ROLES = ["ELDERLY", "FAMILY_CARER", "VOLUNTEER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** 任務狀態（對應資料庫 task_status enum） */
export const TASK_STATUSES = ["OPEN", "MATCHED", "COMPLETED", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** 資金來源（對應資料庫 funding_type enum） */
export const FUNDING_TYPES = [
  "SELF_CREDIT",
  "OVERDRAFT",
  "COMMUNITY_POOL",
  "PURE_VOLUNTEER",
] as const;
export type FundingType = (typeof FUNDING_TYPES)[number];

/** 帳本分錄類別（對應資料庫 ledger_category enum） */
export const LEDGER_CATEGORIES = [
  "SIGNUP_GRANT",
  "TASK_EARN",
  "TASK_SPEND",
  "OVERDRAFT_SPEND",
  "POOL_DONATION",
  "POOL_SUBSIDY",
  "FAMILY_TRANSFER",
] as const;
export type LedgerCategory = (typeof LEDGER_CATEGORIES)[number];

/** 角色中文標籤 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ELDERLY: "長者",
  FAMILY_CARER: "家屬",
  VOLUNTEER: "義工",
};

/** 任務狀態中文標籤 */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  OPEN: "待接單",
  MATCHED: "已接單",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

/** 資金來源中文標籤 */
export const FUNDING_TYPE_LABELS: Record<FundingType, string> = {
  SELF_CREDIT: "自有信用",
  OVERDRAFT: "透支額度",
  COMMUNITY_POOL: "愛心公池",
  PURE_VOLUNTEER: "純義工",
};

/** 帳本分錄類別中文標籤 */
export const LEDGER_CATEGORY_LABELS: Record<LedgerCategory, string> = {
  SIGNUP_GRANT: "迎新贈送",
  TASK_EARN: "任務賺取",
  TASK_SPEND: "任務支出",
  OVERDRAFT_SPEND: "透支支出",
  POOL_DONATION: "公池捐贈",
  POOL_SUBSIDY: "公池補貼",
  FAMILY_TRANSFER: "家屬轉贈",
};
