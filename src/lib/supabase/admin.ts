import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 建立具 service_role 權限的 Supabase client（繞過 RLS）。
 * 僅供伺服器端受信任流程使用（Server Action、Route Handler），
 * 嚴禁暴露至瀏覽器端。
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "缺少 SUPABASE_SERVICE_ROLE_KEY 環境變數，無法建立 admin client。"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
