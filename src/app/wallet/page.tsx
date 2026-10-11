import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEDGER_CATEGORY_LABELS } from "@/constants/hongkong";
import { getSession, getWallet } from "@/lib/data";
import { formatCredits, formatScheduledAt } from "@/lib/task";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "我的時間錢包",
};

export default async function WalletPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const { profile, ledger } = await getWallet(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">我的時間錢包</h1>
      <p className="mt-2 text-muted-foreground">
        查看時間信用餘額、透支額度及流水帳本。
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">餘額總覽</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/60 px-3 py-3">
            <p className="text-sm text-muted-foreground">可用時間信用</p>
            <p className="text-2xl font-semibold">
              {formatCredits(profile.credit_balance)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-3">
            <p className="text-sm text-muted-foreground">透支額度</p>
            <p className="text-2xl font-semibold">{formatCredits(profile.credit_line)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">帳本流水</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {ledger.length > 0 ? (
            ledger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      entry.amount >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {entry.amount >= 0 ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{entry.note}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatScheduledAt(entry.created_at)} ·{" "}
                      {LEDGER_CATEGORY_LABELS[entry.category] ?? entry.category}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    entry.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {entry.amount.toFixed(1)} TC
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground">暫無交易紀錄。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
