"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldCheck, Star } from "lucide-react";

import { applyKycVerification } from "@/app/account/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KYC_VERIFICATION_FEE_HKD } from "@/constants/hongkong";

const BENEFITS = [
  "優先派單權",
  "長者信任徽章",
  "解鎖入屋類服務資格",
  "可加購微型意外保障包",
];

export function KycCard({
  isVerified,
}: {
  isVerified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    setLoading(true);
    setError(null);
    const result = await applyKycVerification();
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "申請失敗，請稍後再試。");
      return;
    }
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          志工金牌認證（實名認證）
        </CardTitle>
        <CardDescription>
          完成實名與背景審核，取得長者信任，解鎖更多服務資格。
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ul className="space-y-2 text-sm">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              {benefit}
            </li>
          ))}
        </ul>

        {isVerified ? (
          <div className="flex items-center gap-2">
            <Badge className="gap-1 bg-amber-500 text-white">
              <BadgeCheck className="size-4" />
              已金牌認證
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              認證費：HK$ {KYC_VERIFICATION_FEE_HKD}
            </p>
            <Button onClick={apply} disabled={loading} className="w-full sm:w-auto">
              {loading ? "處理中…" : "申請志工實名認證"}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
