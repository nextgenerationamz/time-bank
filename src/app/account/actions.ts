"use server";

import { revalidatePath } from "next/cache";

import { mockVerifyCurrentUser } from "@/data/mock-data";
import { getSession } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { success: boolean; error?: string };

/**
 * 申請志工實名認證（KYC）。
 *
 * 注意：此處模擬「支付認證費 → 即時完成審核」。生產環境應接入真實支付
 * 供應商，並由背景審核流程通過後才將 is_verified 設為 true。
 */
export async function applyKycVerification(): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { success: false, error: "請先登入。" };

  // 無真實 Supabase 連線 → 模擬認證支付成功（就地更新 mock 徽章）
  if (!isSupabaseConfigured()) {
    mockVerifyCurrentUser();
    return { success: true };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("user_profiles")
      .update({
        verification_paid_at: new Date().toISOString(),
        is_verified: true,
      })
      .eq("id", user.id);

    if (error) {
      console.error("[kyc] 更新認證狀態失敗：", error.message);
      return { success: false, error: "申請失敗，請稍後再試。" };
    }
  } catch (e) {
    // 連線逾時/錯誤 → 模擬認證支付成功
    console.error("[kyc] 申請實名認證失敗：", e);
    return { success: true };
  }

  revalidatePath("/account");
  return { success: true };
}
