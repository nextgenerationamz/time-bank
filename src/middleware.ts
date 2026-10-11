import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * 判斷 Supabase 環境變數是否為佔位/未設定值。
 * 若尚未填寫真實配置，middleware 直接安全放行，避免拋出錯誤。
 */
function isPlaceholderSupabaseConfig(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return true;

  const markers = [
    "placeholder",
    "your-project",
    "your-anon-key",
    "your-service-role-key",
    "dummy",
  ];
  const url = supabaseUrl.toLowerCase();
  const key = supabaseKey.toLowerCase();

  return markers.some((m) => url.includes(m)) || markers.some((m) => key.includes(m));
}

export async function middleware(request: NextRequest) {
  // 沒有真實的 Supabase 配置時，直接安全放行，不拋出錯誤
  if (isPlaceholderSupabaseConfig()) {
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
