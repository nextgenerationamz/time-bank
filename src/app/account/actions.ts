"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: boolean; error?: string };

/**
 * 申請志工實名認證（KYC）。
 *
 * 注意：此處模擬「支付認證費 → 即時完成審核」。生產環境應接入真實支付
 * 供應商，並由背景審核流程通過後才將 is_verified 設為 true。
 */
export async function applyKycVerification(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "請先登入。" };

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
    console.error("[kyc] 申請實名認證失敗：", e);
    return { success: false, error: "申請失敗，請稍後再試。" };
  }

  revalidatePath("/account");
  return { success: true };
}
