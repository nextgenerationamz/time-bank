import type { Metadata, Viewport } from "next";
import { HeartHandshake } from "lucide-react";

import "./globals.css";
import { SiteHeader, type HeaderUser } from "@/components/site-header";
import { SITE_NAME } from "@/constants/hongkong";
import { getSession } from "@/lib/data";

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
  const { user, profile } = await getSession();

  const headerUser: HeaderUser = user
    ? {
        email: user.email,
        displayName: profile?.display_name ?? null,
        role: profile?.role ?? null,
      }
    : null;

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
