import type { Metadata, Viewport } from "next";
import { HeartHandshake } from "lucide-react";

import "./globals.css";
import { SiteHeader, type HeaderUser } from "@/components/site-header";
import { SITE_NAME } from "@/constants/hongkong";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "香港社區長者互助平台 — 以時間換取互助，長者、家屬與義工攜手同行。",
};

export const viewport: Viewport = {
  themeColor: "#166534",
};

// 於 hydration 前套用長者友好模式，避免閃爍
const elderlyModeScript = `
(function () {
  try {
    if (localStorage.getItem("elderly-mode") === "1") {
      document.documentElement.classList.add("elderly");
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let headerUser: HeaderUser = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      let displayName: string | null = null;
      let role: string | null = null;

      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, role")
          .eq("id", user.id)
          .maybeSingle();
        displayName = profile?.display_name ?? null;
        role = profile?.role ?? null;
      } catch {
        // 忽略 profile 查詢錯誤
      }

      headerUser = {
        email: user.email ?? null,
        displayName,
        role,
      };
    }
  } catch {
    // 尚未設定 Supabase 環境變數或連線失敗時，以未登入狀態呈現
    headerUser = null;
  }

  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: elderlyModeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <SiteHeader user={headerUser} />
        <main className="flex-1">{children}</main>
        <footer className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <p className="flex items-center gap-1.5">
              <HeartHandshake className="size-4" />
              {SITE_NAME}
            </p>
            <p>長者互助 · 以時間換取關懷</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
