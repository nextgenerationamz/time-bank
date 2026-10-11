import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

import { KycCard } from "@/components/account/kyc-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { USER_ROLE_LABELS, type UserRole } from "@/constants/hongkong";
import { formatCredits } from "@/lib/task";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "個人中心",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "display_name, email, role, credit_balance, credit_line, is_verified, company_id"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">個人中心</h1>
      <p className="mt-2 text-muted-foreground">管理你的個人資料與志工認證。</p>

      {/* 基本資料 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">基本資料</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">稱呼</p>
            <p className="font-medium">{profile?.display_name || "未設定"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">身份</p>
            <Badge variant="secondary">
              {profile?.role
                ? USER_ROLE_LABELS[profile.role as UserRole] ?? profile.role
                : "—"}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">電郵</p>
            <p className="font-medium">{profile?.email || user.email || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">時間信用餘額</p>
            <p className="font-medium">
              {formatCredits(Number(profile?.credit_balance ?? 0))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 企業入口（若為企業員工） */}
      {profile?.company_id ? (
        <div className="mt-6">
          <Link
            href="/enterprise/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <Building2 className="size-4" />
            前往企業 ESG 專區
          </Link>
        </div>
      ) : null}

      {/* KYC 認證卡片 */}
      <div className="mt-6">
        <KycCard isVerified={profile?.is_verified ?? false} />
      </div>
    </div>
  );
}
