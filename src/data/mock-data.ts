// =====================================================================
// 香港社區時間銀行 — 高擬真度本地 Mock 資料
// 用於在沒有 Supabase 真實連線時，讓網站所有頁面依然可流暢瀏覽。
// =====================================================================

import {
  type LedgerCategory,
  type UserRole,
} from "@/constants/hongkong";
import type { TaskDetail } from "@/lib/task";

export type MockProfile = {
  id: string;
  role: UserRole;
  display_name: string;
  email: string | null;
  phone_number: string | null;
  credit_balance: number;
  credit_line: number;
  linked_elderly_id: string | null;
  is_verified: boolean;
  verification_paid_at: string | null;
  company_id: string | null;
  /** 附加的展示用欄位 */
  service_count?: number;
  age?: number;
};

export type MockLedgerEntry = {
  id: string;
  user_id: string;
  task_id: string | null;
  amount: number;
  category: LedgerCategory;
  note: string;
  created_at: string;
};

export type MockEnterprise = {
  id: string;
  name: string;
  logo_url: string | null;
  sponsored_pool_credits: number;
  total_contributed_hkd: number;
  total_service_hours: number;
  employee_count: number;
};

function task(
  data: Pick<
    TaskDetail,
    "id" | "title" | "district" | "category" | "duration_minutes" | "time_credits_cost" | "status"
  > &
    Partial<TaskDetail>
): TaskDetail {
  return {
    creator_id: "elderly-wong",
    volunteer_id: null,
    description: null,
    approx_location: "",
    exact_address: "香港新界沙田美林邨美槐樓 1208 室",
    contact_name: "黃伯",
    contact_phone: "61234567",
    scheduled_at: null,
    funding_type: "SELF_CREDIT",
    created_at: "2026-10-01T08:00:00+08:00",
    has_insurance_coverage: false,
    insurance_fee_hkd: 0,
    enterprise_tag_id: null,
    enterprise_name: null,
    ...data,
  };
}

// ---------------------------------------------------------------------
// D. 企業 ESG 儀表板數據
// ---------------------------------------------------------------------
export const MOCK_ENTERPRISES: MockEnterprise[] = [
  {
    id: "enterprise-hsbc",
    name: "匯豐志願服務隊",
    logo_url: null,
    sponsored_pool_credits: 3000,
    total_contributed_hkd: 128000,
    total_service_hours: 1420,
    employee_count: 128,
  },
  {
    id: "enterprise-clp",
    name: "中電愛心行",
    logo_url: null,
    sponsored_pool_credits: 1800,
    total_contributed_hkd: 86000,
    total_service_hours: 890,
    employee_count: 76,
  },
  {
    id: "enterprise-hkelectric",
    name: "港燈義工隊",
    logo_url: null,
    sponsored_pool_credits: 1200,
    total_contributed_hkd: 54000,
    total_service_hours: 640,
    employee_count: 52,
  },
];

// ---------------------------------------------------------------------
// B. 用戶檔案數據（涵蓋三種角色）
// ---------------------------------------------------------------------
export const MOCK_PROFILES: MockProfile[] = [
  {
    id: "elderly-wong",
    role: "ELDERLY",
    display_name: "黃伯",
    email: "wong.bo@example.com",
    phone_number: "61234567",
    credit_balance: 6.5,
    credit_line: 10.0,
    linked_elderly_id: null,
    is_verified: false,
    verification_paid_at: null,
    company_id: null,
    age: 81,
  },
  {
    id: "volunteer-heo",
    role: "VOLUNTEER",
    display_name: "何小姐",
    email: "heo.yungsze@example.com",
    phone_number: "98765432",
    credit_balance: 34.0,
    credit_line: 10.0,
    linked_elderly_id: null,
    is_verified: true,
    verification_paid_at: "2026-03-15T10:30:00+08:00",
    company_id: "enterprise-hsbc",
    service_count: 18,
    age: 26,
  },
  {
    id: "family-wong",
    role: "FAMILY_CARER",
    display_name: "黃家明",
    email: "wong.kaming@example.com",
    phone_number: "92345678",
    credit_balance: 15.0,
    credit_line: 10.0,
    linked_elderly_id: "elderly-wong",
    is_verified: false,
    verification_paid_at: null,
    company_id: null,
  },
  {
    id: "volunteer-chan",
    role: "VOLUNTEER",
    display_name: "陳志偉",
    email: "chan.chiwai@example.com",
    phone_number: "93456789",
    credit_balance: 21.5,
    credit_line: 10.0,
    linked_elderly_id: null,
    is_verified: true,
    verification_paid_at: "2025-11-02T14:00:00+08:00",
    company_id: null,
  },
];

// ---------------------------------------------------------------------
// A. 任務數據列表（12 條不同狀態與區域）
// ---------------------------------------------------------------------
export const MOCK_TASKS: TaskDetail[] = [
  task({
    id: "task-001",
    title: "威爾斯親王醫院心臟科覆診",
    district: "沙田區",
    category: "陪診就醫",
    description: "陪黃伯由美林邨前往威爾斯親王醫院心臟科覆診，需協助輪椅。",
    approx_location: "美林邨 · 美槐樓",
    exact_address: "香港新界沙田美林邨美槐樓 1208 室",
    contact_name: "黃伯",
    contact_phone: "61234567",
    scheduled_at: "2026-11-18T09:30:00+08:00",
    duration_minutes: 150,
    time_credits_cost: 2.5,
    status: "OPEN",
    funding_type: "COMMUNITY_POOL",
    has_insurance_coverage: false,
    insurance_fee_hkd: 0,
  }),
  task({
    id: "task-002",
    title: "瑪麗醫院眼科打針",
    district: "中西區",
    category: "陪診就醫",
    description: "陪同前往瑪麗醫院眼科覆診打針，全程約兩小時。",
    approx_location: "西營盤德輔道西",
    exact_address: "香港西營盤德輔道西 288 號 15 樓 B 室",
    contact_name: "黃伯",
    contact_phone: "61234567",
    scheduled_at: "2026-11-12T14:00:00+08:00",
    duration_minutes: 120,
    time_credits_cost: 2.0,
    status: "MATCHED",
    funding_type: "SELF_CREDIT",
    volunteer_id: "volunteer-chan",
    has_insurance_coverage: true,
    insurance_fee_hkd: 50,
  }),
  task({
    id: "task-003",
    title: "旺角街市買新鮮魚菜及惠康取藥",
    district: "油尖旺區",
    category: "街市代購/取藥",
    description: "代購新鮮魚菜，並到惠康代取高血壓慢病藥。",
    approx_location: "大角咀富榮花園",
    scheduled_at: "2026-11-16T10:00:00+08:00",
    duration_minutes: 60,
    time_credits_cost: 1.0,
    status: "OPEN",
    funding_type: "SELF_CREDIT",
  }),
  task({
    id: "task-004",
    title: "教用智能手機登入「醫健通」及 WhatsApp 視像",
    district: "深水埗區",
    category: "數碼電子支援",
    description: "教長者使用智能手機登入醫健通，並設定 WhatsApp 視像通話。",
    approx_location: "南昌邨",
    scheduled_at: "2026-11-20T15:00:00+08:00",
    duration_minutes: 90,
    time_credits_cost: 1.5,
    status: "OPEN",
    funding_type: "OVERDRAFT",
  }),
  task({
    id: "task-005",
    title: "浴室更換防跌吸盤扶手及廚房更換 LED 燈泡",
    district: "東區",
    category: "家居修繕",
    description: "協助更換浴室防跌吸盤扶手與廚房 LED 燈泡，附帶防滑沐浴椅推薦。",
    approx_location: "柴灣興華邨",
    scheduled_at: "2026-10-05T11:00:00+08:00",
    duration_minutes: 60,
    time_credits_cost: 1.0,
    status: "COMPLETED",
    funding_type: "SELF_CREDIT",
    volunteer_id: "volunteer-chan",
  }),
  task({
    id: "task-006",
    title: "上門傾偈回憶老香港、陪下中國象棋",
    district: "觀塘區",
    category: "生活傾偈/伴聊",
    description: "上門與長者傾偈回憶老香港故事，並陪下中國象棋。",
    approx_location: "牛頭角下邨",
    scheduled_at: "2026-11-22T15:30:00+08:00",
    duration_minutes: 60,
    time_credits_cost: 1.0,
    status: "OPEN",
    funding_type: "SELF_CREDIT",
  }),
  task({
    id: "task-007",
    title: "代取智能櫃重物包裹及街市買生果",
    district: "葵青區",
    category: "街市代購/取藥",
    description: "代取智能櫃重物包裹，並到街市買生果。",
    approx_location: "葵芳閣",
    exact_address: "香港新界葵涌葵芳閣 5 座 902 室",
    contact_name: "黃伯",
    contact_phone: "61234567",
    scheduled_at: "2026-11-14T16:00:00+08:00",
    duration_minutes: 30,
    time_credits_cost: 0.5,
    status: "MATCHED",
    funding_type: "SELF_CREDIT",
    volunteer_id: "volunteer-heo",
  }),
  task({
    id: "task-008",
    title: "屯門醫院骨科物理治療",
    district: "屯門區",
    category: "陪診就醫",
    description: "陪同長者前往屯門醫院骨科物理治療，需使用輪椅。",
    approx_location: "友愛邨",
    scheduled_at: "2026-11-25T09:00:00+08:00",
    duration_minutes: 180,
    time_credits_cost: 3.0,
    status: "OPEN",
    funding_type: "SELF_CREDIT",
    enterprise_tag_id: "enterprise-hkelectric",
    enterprise_name: "港燈義工隊",
    has_insurance_coverage: true,
    insurance_fee_hkd: 50,
  }),
  task({
    id: "task-009",
    title: "協助填寫樂悠咭申請表格",
    district: "九龍城區",
    category: "數碼電子支援",
    description: "協助長者填寫樂悠咭申請表格。",
    approx_location: "愛民邨",
    scheduled_at: "2026-09-28T10:00:00+08:00",
    duration_minutes: 60,
    time_credits_cost: 1.0,
    status: "COMPLETED",
    funding_type: "SELF_CREDIT",
    volunteer_id: "volunteer-heo",
  }),
  task({
    id: "task-010",
    title: "協助高處拭抹抽油煙機與窗框",
    district: "黃大仙區",
    category: "家居修繕",
    description: "協助長者拭抹高處抽油煙機與窗框。",
    approx_location: "竹園南邨",
    scheduled_at: "2026-11-23T14:00:00+08:00",
    duration_minutes: 120,
    time_credits_cost: 2.0,
    status: "OPEN",
    funding_type: "SELF_CREDIT",
  }),
  task({
    id: "task-011",
    title: "博愛醫院老年科常規檢查",
    district: "元朗區",
    category: "陪診就醫",
    description: "陪同前往博愛醫院老年科常規檢查。",
    approx_location: "水邊圍邨",
    scheduled_at: "2026-11-27T09:30:00+08:00",
    duration_minutes: 120,
    time_credits_cost: 2.0,
    status: "OPEN",
    funding_type: "SELF_CREDIT",
  }),
  task({
    id: "task-012",
    title: "線上廣東話老火湯煲湯心得傳授",
    district: "灣仔區",
    category: "生活傾偈/伴聊",
    description: "長者回饋社區，線上傳授廣東話老火湯煲湯心得。",
    approx_location: "駱克道",
    scheduled_at: "2026-11-19T18:00:00+08:00",
    duration_minutes: 45,
    time_credits_cost: 0.75,
    status: "OPEN",
    funding_type: "PURE_VOLUNTEER",
    creator_id: "elderly-wong",
  }),
];

// ---------------------------------------------------------------------
// C. 時間銀行帳本流水（9 條交易明細）
// ---------------------------------------------------------------------
export const MOCK_LEDGER: MockLedgerEntry[] = [
  {
    id: "ledger-001",
    user_id: "volunteer-heo",
    task_id: null,
    amount: 10.0,
    category: "SIGNUP_GRANT",
    note: "迎新贈送",
    created_at: "2025-06-01T10:00:00+08:00",
  },
  {
    id: "ledger-002",
    user_id: "volunteer-heo",
    task_id: "task-009",
    amount: 1.0,
    category: "TASK_EARN",
    note: "完成陪伴就診（樂悠咭申請）",
    created_at: "2026-09-28T12:00:00+08:00",
  },
  {
    id: "ledger-003",
    user_id: "volunteer-heo",
    task_id: null,
    amount: -2.0,
    category: "POOL_DONATION",
    note: "捐贈社區愛心公池",
    created_at: "2026-10-01T09:00:00+08:00",
  },
  {
    id: "ledger-004",
    user_id: "elderly-wong",
    task_id: "task-003",
    amount: -1.5,
    category: "TASK_SPEND",
    note: "發布需求扣除時間信用",
    created_at: "2026-10-10T11:00:00+08:00",
  },
  {
    id: "ledger-005",
    user_id: "elderly-wong",
    task_id: null,
    amount: 5.0,
    category: "FAMILY_TRANSFER",
    note: "家屬黃家明孝心轉贈",
    created_at: "2026-10-12T15:00:00+08:00",
  },
  {
    id: "ledger-006",
    user_id: "volunteer-heo",
    task_id: "task-007",
    amount: 0.5,
    category: "TASK_EARN",
    note: "完成代購/取件服務",
    created_at: "2026-10-14T18:00:00+08:00",
  },
  {
    id: "ledger-007",
    user_id: "elderly-wong",
    task_id: "task-004",
    amount: -1.5,
    category: "OVERDRAFT_SPEND",
    note: "長者信用透支額度發布",
    created_at: "2026-10-18T10:30:00+08:00",
  },
  {
    id: "ledger-008",
    user_id: "elderly-wong",
    task_id: "task-001",
    amount: 2.5,
    category: "POOL_SUBSIDY",
    note: "愛心公池資助發布",
    created_at: "2026-10-20T09:00:00+08:00",
  },
  {
    id: "ledger-009",
    user_id: "volunteer-heo",
    task_id: "task-005",
    amount: 1.0,
    category: "TASK_EARN",
    note: "完成家居修繕服務",
    created_at: "2026-10-05T13:00:00+08:00",
  },
];

// ---------------------------------------------------------------------
// 當前登入用戶（Mock 模式預設為金牌志工「何小姐」）
// ---------------------------------------------------------------------
export const MOCK_CURRENT_USER_ID = "volunteer-heo";

export function getMockProfileById(id: string | null | undefined): MockProfile | null {
  if (!id) return null;
  return MOCK_PROFILES.find((p) => p.id === id) ?? null;
}

export function getMockCurrentProfile(): MockProfile {
  return MOCK_PROFILES.find((p) => p.id === MOCK_CURRENT_USER_ID) ?? MOCK_PROFILES[0];
}

// ---------------------------------------------------------------------
// Mock 模式就地變更（供 Server Action 模擬樂觀更新，重新整理後依然可見）
// ---------------------------------------------------------------------
export function mockAcceptTask(taskId: string, volunteerId: string): void {
  const t = MOCK_TASKS.find((x) => x.id === taskId);
  if (t) {
    t.status = "MATCHED";
    t.volunteer_id = volunteerId;
  }
}

export function mockCancelMatch(taskId: string): void {
  const t = MOCK_TASKS.find((x) => x.id === taskId);
  if (t) {
    t.status = "OPEN";
    t.volunteer_id = null;
  }
}

export function mockSettleTask(taskId: string): void {
  const t = MOCK_TASKS.find((x) => x.id === taskId);
  if (t) t.status = "COMPLETED";
}

export function mockAddInsurance(taskId: string): void {
  const t = MOCK_TASKS.find((x) => x.id === taskId);
  if (t) {
    t.has_insurance_coverage = true;
    t.insurance_fee_hkd = 50;
  }
}

export function mockVerifyCurrentUser(): void {
  const p = getMockCurrentProfile();
  p.is_verified = true;
  p.verification_paid_at = new Date().toISOString();
}


