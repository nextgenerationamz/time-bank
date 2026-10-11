import type { LedgerCategory, UserRole } from "@/constants/hongkong";
import {
  MOCK_CURRENT_USER_ID,
  MOCK_ENTERPRISES,
  MOCK_LEDGER,
  MOCK_TASKS,
  getMockCurrentProfile,
  getMockProfileById,
  type MockEnterprise,
  type MockLedgerEntry,
  type MockProfile,
} from "@/data/mock-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TaskDetail, TaskSummary } from "@/lib/task";

export type SessionUser = {
  id: string;
  email: string | null;
};

export type SessionData = {
  user: SessionUser | null;
  profile: MockProfile | null;
};

export type TaskFilters = {
  district?: string;
  category?: string;
  status?: string;
  enterprise?: string;
};

export type WalletData = {
  profile: MockProfile;
  ledger: MockLedgerEntry[];
};

export type EnterpriseDashboardData = {
  enterprise: MockEnterprise;
  stats: {
    totalServiceHours: number;
    employeeCount: number;
    elderlyBeneficiaries: number;
  };
};

function mockUser(): SessionUser {
  const profile = getMockCurrentProfile();
  return { id: profile.id, email: profile.email };
}

// ---------------------------------------------------------------------
// 資料庫欄位 → MockProfile 對應
// ---------------------------------------------------------------------
type ProfileRow = {
  id: string;
  role?: UserRole | string | null;
  display_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  credit_balance?: number | string | null;
  credit_line?: number | string | null;
  linked_elderly_id?: string | null;
  is_verified?: boolean | null;
  verification_paid_at?: string | null;
  company_id?: string | null;
};

function mapProfile(row: ProfileRow): MockProfile {
  return {
    id: row.id,
    role: (row.role as UserRole) ?? "VOLUNTEER",
    display_name: row.display_name ?? "",
    email: row.email ?? null,
    phone_number: row.phone_number ?? null,
    credit_balance: Number(row.credit_balance ?? 0),
    credit_line: Number(row.credit_line ?? 10),
    linked_elderly_id: row.linked_elderly_id ?? null,
    is_verified: Boolean(row.is_verified),
    verification_paid_at: row.verification_paid_at ?? null,
    company_id: row.company_id ?? null,
  };
}

// ---------------------------------------------------------------------
// 1. 目前登入用戶（含 mock 降級）
// ---------------------------------------------------------------------
export async function getSession(): Promise<SessionData> {
  if (!isSupabaseConfigured()) {
    return { user: mockUser(), profile: getMockCurrentProfile() };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user: { id: user.id, email: user.email ?? null },
      profile: profile ? mapProfile(profile) : getMockCurrentProfile(),
    };
  } catch {
    // 連線逾時/錯誤 → 靜默回退 mock
    return { user: mockUser(), profile: getMockCurrentProfile() };
  }
}

// ---------------------------------------------------------------------
// 2. 任務列表
// ---------------------------------------------------------------------
function filterMockTasks(filters: TaskFilters): TaskSummary[] {
  let tasks: TaskSummary[] = [...MOCK_TASKS];
  if (filters.district) tasks = tasks.filter((t) => t.district === filters.district);
  if (filters.category) tasks = tasks.filter((t) => t.category === filters.category);
  if (filters.status === "OPEN" || filters.status === "MATCHED") {
    tasks = tasks.filter((t) => t.status === filters.status);
  }
  if (filters.enterprise === "1") {
    tasks = tasks.filter((t) => t.enterprise_tag_id);
  }
  return tasks.sort((a, b) =>
    (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? "")
  );
}

export async function getTasks(filters: TaskFilters = {}): Promise<TaskSummary[]> {
  if (!isSupabaseConfigured()) return filterMockTasks(filters);

  try {
    const supabase = await createClient();
    let query = supabase
      .from("tasks_public")
      .select("*")
      .order("scheduled_at", { ascending: true, nullsFirst: false });

    if (filters.district) query = query.eq("district", filters.district);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.status === "OPEN" || filters.status === "MATCHED") {
      query = query.eq("status", filters.status);
    }
    if (filters.enterprise === "1") {
      query = query.not("enterprise_tag_id", "is", null);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return filterMockTasks(filters);
    return data as TaskSummary[];
  } catch {
    return filterMockTasks(filters);
  }
}

// ---------------------------------------------------------------------
// 3. 任務詳情（依 URL id 查找；找不到回傳第一項，不拋 404/500）
// ---------------------------------------------------------------------
function mockTaskDetail(id: string): TaskDetail {
  const task = MOCK_TASKS.find((t) => t.id === id) ?? MOCK_TASKS[0];
  const canView =
    MOCK_CURRENT_USER_ID === task.creator_id ||
    MOCK_CURRENT_USER_ID === task.volunteer_id;
  return {
    ...task,
    exact_address: canView ? task.exact_address : null,
    contact_name: canView ? task.contact_name : null,
    contact_phone: canView ? task.contact_phone : null,
  };
}

export async function getTaskDetail(id: string): Promise<TaskDetail | null> {
  if (!isSupabaseConfigured()) return mockTaskDetail(id);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_task_detail", { p_task_id: id });
    const task = Array.isArray(data) ? (data as TaskDetail[])[0] : null;
    if (error || !task) return mockTaskDetail(id);
    return task;
  } catch {
    return mockTaskDetail(id);
  }
}

// ---------------------------------------------------------------------
// 4. 我的時間錢包（profile + 帳本流水）
// ---------------------------------------------------------------------
function mockWallet(userId: string): WalletData {
  return {
    profile: getMockProfileById(userId) ?? getMockCurrentProfile(),
    ledger: MOCK_LEDGER.filter((l) => l.user_id === userId),
  };
}

export async function getWallet(userId: string): Promise<WalletData> {
  if (!isSupabaseConfigured()) return mockWallet(userId);

  try {
    const supabase = await createClient();
    const [{ data: profile }, { data: ledger, error }] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("time_credit_ledger")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (error || !ledger || ledger.length === 0) return mockWallet(userId);

    return {
      profile: profile ? mapProfile(profile) : getMockCurrentProfile(),
      ledger: ledger.map((l) => ({
        id: String(l.id),
        user_id: l.user_id,
        task_id: l.task_id,
        amount: Number(l.amount ?? 0),
        category: l.category as LedgerCategory,
        note: l.note,
        created_at: l.created_at,
      })),
    };
  } catch {
    return mockWallet(userId);
  }
}

// ---------------------------------------------------------------------
// 5. 企業 ESG 儀表板
// ---------------------------------------------------------------------
function mockEnterpriseDashboard(companyId: string): EnterpriseDashboardData {
  const enterprise =
    MOCK_ENTERPRISES.find((e) => e.id === companyId) ?? MOCK_ENTERPRISES[0];
  return {
    enterprise,
    stats: {
      totalServiceHours: enterprise.total_service_hours,
      employeeCount: enterprise.employee_count,
      elderlyBeneficiaries: MOCK_TASKS.filter(
        (t) => t.enterprise_tag_id === companyId
      ).length,
    },
  };
}

export async function getEnterpriseDashboard(
  companyId: string
): Promise<EnterpriseDashboardData | null> {
  if (!isSupabaseConfigured()) return mockEnterpriseDashboard(companyId);

  try {
    const admin = createAdminClient();
    const { data: enterprise } = await admin
      .from("enterprises")
      .select("*")
      .eq("id", companyId)
      .single();

    if (!enterprise) return mockEnterpriseDashboard(companyId);

    const { data: logs } = await admin
      .from("esg_service_logs")
      .select("user_id, service_hours")
      .eq("enterprise_id", companyId);
    const { data: sponsoredTasks } = await admin
      .from("tasks")
      .select("creator_id")
      .eq("enterprise_tag_id", companyId);

    const totalServiceHours = (logs ?? []).reduce(
      (sum, r) => sum + Number(r.service_hours ?? 0),
      0
    );
    const employeeCount = new Set((logs ?? []).map((r) => r.user_id)).size;
    const elderlyBeneficiaries = new Set(
      (sponsoredTasks ?? []).map((r) => r.creator_id)
    ).size;

    return {
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        logo_url: enterprise.logo_url ?? null,
        sponsored_pool_credits: Number(enterprise.sponsored_pool_credits ?? 0),
        total_contributed_hkd: Number(enterprise.total_contributed_hkd ?? 0),
        total_service_hours: totalServiceHours,
        employee_count: employeeCount,
      },
      stats: { totalServiceHours, employeeCount, elderlyBeneficiaries },
    };
  } catch {
    return mockEnterpriseDashboard(companyId);
  }
}

