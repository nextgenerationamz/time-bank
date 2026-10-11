/**
 * 判斷是否已填入真實的 Supabase 環境變數。
 * 若為佔位/未設定值，回傳 false，觸發全站 Mock 降級。
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;

  const markers = [
    "placeholder",
    "your-project",
    "your-anon-key",
    "your-service-role-key",
    "dummy",
  ];
  const u = url.toLowerCase();
  const k = key.toLowerCase();

  return !markers.some((m) => u.includes(m) || k.includes(m));
}
