"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Accessibility,
  HeartHandshake,
  LogIn,
  LogOut,
  Menu,
  Plus,
  User,
  Wallet,
  X,
} from "lucide-react";

import { signOutAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { USER_ROLE_LABELS, type UserRole } from "@/constants/hongkong";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/tasks", label: "任務大廳", icon: HeartHandshake },
  { href: "/tasks/create", label: "發布需求", icon: Plus },
  { href: "/wallet", label: "我的時間錢包", icon: Wallet },
  { href: "/account", label: "個人中心", icon: User },
] as const;

export type HeaderUser = {
  email: string | null;
  displayName: string | null;
  role: string | null;
} | null;

function roleLabel(role: string | null): string {
  if (!role) return "";
  return USER_ROLE_LABELS[role as UserRole] ?? role;
}

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [elderlyMode, setElderlyMode] = useState(false);

  useEffect(() => {
    setElderlyMode(document.documentElement.classList.contains("elderly"));
  }, []);

  const toggleElderlyMode = () => {
    setElderlyMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("elderly", next);
      try {
        localStorage.setItem("elderly-mode", next ? "1" : "0");
      } catch {
        // 忽略 localStorage 錯誤（例如私隱模式）
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <HeartHandshake className="size-5" />
          </span>
          <span className="hidden text-lg leading-tight sm:inline">
            香港社區時間銀行
          </span>
          <span className="text-lg leading-tight sm:hidden">時間銀行</span>
        </Link>

        {/* 桌面版導航 */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* 長者友好模式 */}
          <Button
            type="button"
            variant={elderlyMode ? "default" : "outline"}
            size="sm"
            onClick={toggleElderlyMode}
            aria-pressed={elderlyMode}
            title="長者友好模式：字體較大、對比度清晰"
          >
            <Accessibility className="size-4" />
            <span className="hidden lg:inline">
              {elderlyMode ? "已開啟長者模式" : "長者友好模式"}
            </span>
          </Button>

          {/* 登入 / 個人狀態 */}
          {user ? (
            <form action={signOutAction} className="flex items-center gap-2">
              <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
                {user.displayName || user.email || "用戶"}
              </span>
              {user.role ? (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {roleLabel(user.role)}
                </Badge>
              ) : null}
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                aria-label="登出"
              >
                <LogOut className="size-4" />
                <span>登出</span>
              </Button>
            </form>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              <LogIn className="size-4" />
              <span>登入</span>
            </Link>
          )}

          {/* 流動版選單按鈕 */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* 流動版選單 */}
      {menuOpen ? (
        <nav className="border-t md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <form action={signOutAction} className="mt-1">
                <Button type="submit" variant="outline" className="w-full">
                  <LogOut className="size-4" />
                  登出（{user.displayName || user.email || "用戶"}）
                </Button>
              </form>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className={cn(buttonVariants({ variant: "outline" }), "mt-1 w-full")}
              >
                <LogIn className="size-4" />
                登入
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
