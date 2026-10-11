import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Clock, HeartHandshake, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEnterpriseDashboard, getSession } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "企業 ESG 專區",
};

export default async function EnterpriseDashboardPage() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login");

  const companyId = profile?.company_id;
  if (!companyId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">非企業帳戶</h1>
        <p className="mt-2 text-muted-foreground">
          此頁面為企業管理員專區，你的帳戶尚未關聯任何企業。
        </p>
        <Link href="/tasks" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          返回任務大廳
        </Link>
      </div>
    );
  }

  const dashboard = await getEnterpriseDashboard(companyId);
  if (!dashboard) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">企業不存在</h1>
        <p className="mt-2 text-muted-foreground">找不到你所屬的企業資料。</p>
      </div>
    );
  }

  const { enterprise, stats } = dashboard;
  const totalServiceHours = stats.totalServiceHours;
  const employeeCount = stats.employeeCount;
  const elderlyBeneficiaries = stats.elderlyBeneficiaries;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">企業 ESG 專區</h1>
        <Badge variant="secondary" className="gap-1.5">
          <Building2 className="size-3.5" />
          {enterprise.name}
        </Badge>
      </div>
      <p className="mt-2 text-muted-foreground">
        追蹤企業志願服務成果，並導出符合 GRI / ESG 社會責任標準的報告。
      </p>

      {/* 統計卡片 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">企業累計志願時數</CardTitle>
            <Clock className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalServiceHours.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">小時</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">參與員工總數</CardTitle>
            <Users className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{employeeCount}</p>
            <p className="text-sm text-muted-foreground">位員工義工</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">認領資助長者人次</CardTitle>
            <HeartHandshake className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{elderlyBeneficiaries}</p>
            <p className="text-sm text-muted-foreground">位受助長者</p>
          </CardContent>
        </Card>
      </div>

      {/* 企業資訊 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">企業資訊</CardTitle>
          <CardDescription>贊助公池時間幣與累計捐款</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-muted-foreground">贊助公池時間幣</p>
            <p className="text-lg font-semibold">
              {Number(enterprise.sponsored_pool_credits ?? 0).toFixed(1)} TC
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-muted-foreground">累計捐款（港幣）</p>
            <p className="text-lg font-semibold">
              HK$ {Number(enterprise.total_contributed_hkd ?? 0).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 導出 */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href="/api/enterprise/export-csv"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          一鍵導出 GRI / ESG CSV 報告
        </a>
        <p className="text-sm text-muted-foreground">
          報告依據 GRI 413（當地社區）與 ESG 社會（S）面向整理。
        </p>
      </div>
    </div>
  );
}
