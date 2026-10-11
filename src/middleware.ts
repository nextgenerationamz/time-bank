import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 沒有真實的 Supabase 配置時，直接安全放行，不拋出錯誤
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  try {
    // 已填寫真實配置時，正常載入 Supabase Client 邏輯（刷新 auth token）
    return await updateSession(request);
  } catch (error) {
    console.error("Middleware error caught:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
