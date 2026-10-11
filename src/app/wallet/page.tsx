import type { Metadata } from "next";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_CREDIT_LINE,
  SIGNUP_GRANT_CREDITS,
} from "@/constants/hongkong";

export const metadata: Metadata = {
  title: "我的時間錢包",
};

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">我的時間錢包</h1>
      <p className="mt-2 text-muted-foreground">
        查看時間信用餘額、透支額度及流水帳本。
      </p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>迎新贈送 {SIGNUP_GRANT_CREDITS} 時間信用</CardTitle>
          <CardDescription>
            每位新用戶預設贈送 {SIGNUP_GRANT_CREDITS} 信用，並享 {DEFAULT_CREDIT_LINE}{" "}
            透支額度。餘額與流水將於連接 Supabase 後顯示。
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
