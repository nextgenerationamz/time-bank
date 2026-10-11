import { createBrowserClient } from "@supabase/ssr";

/**
 * 建立瀏覽器端的 Supabase client。
 * 僅供 Client Component 使用。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
