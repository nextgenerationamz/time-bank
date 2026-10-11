import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 建立伺服器端的 Supabase client。
 * 僅供 Server Component、Server Action、Route Handler 使用。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Component 中無法設定 cookie，可安全忽略
          }
        },
      },
    }
  );
}
