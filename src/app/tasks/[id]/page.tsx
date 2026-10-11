import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  Clock,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Wallet,
} from "lucide-react";

import { TaskActions } from "@/components/tasks/task-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FUNDING_TYPE_LABELS,
  TASK_STATUS_LABELS,
  type FundingType,
  type TaskStatus,
} from "@/constants/hongkong";
import {
  formatCredits,
  formatDuration,
  formatScheduledAt,
} from "@/lib/task";
import { getSession, getTaskDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "任務詳情",
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user } = await getSession();
  if (!user) redirect("/login");

  const task = await getTaskDetail(id);

  if (!task) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">任務不存在或已移除</h1>
        <p className="mt-2 text-muted-foreground">此任務可能已被刪除，或網址有誤。</p>
        <Link
          href="/tasks"
          className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
        >
          返回任務大廳
        </Link>
      </div>
    );
  }

  const isCreator = user.id === task.creator_id;
  const isVolunteer = user.id === task.volunteer_id;
  const canViewPrivate = isCreator || isVolunteer;
  const matched = task.status === "MATCHED";
  const canCancel =
    !!task.scheduled_at && new Date(task.scheduled_at).getTime() > Date.now();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/tasks"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 返回任務大廳
      </Link>

      <Card className="mt-4">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">{task.category}</Badge>
            {matched ? (
              <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                已接單
              </span>
            ) : (
              <Badge variant="outline">
                {TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl">{task.title}</CardTitle>
          <p className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {task.district}
            {task.approx_location ? ` · ${task.approx_location}` : ""}
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* 公開資訊 */}
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <InfoItem
              icon={<Clock className="size-4" />}
              label="服務時長"
              value={
                task.duration_minutes
                  ? formatDuration(Number(task.duration_minutes))
                  : "彈性"
              }
            />
            <InfoItem
              icon={<Wallet className="size-4" />}
              label="可獲時間幣"
              value={formatCredits(Number(task.time_credits_cost))}
            />
            <InfoItem
              icon={<CalendarClock className="size-4" />}
              label="預約時間"
              value={task.scheduled_at ? formatScheduledAt(task.scheduled_at) : "彈性"}
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>資金來源：</span>
            <Badge variant="outline">
              {FUNDING_TYPE_LABELS[task.funding_type as FundingType] ?? task.funding_type}
            </Badge>
          </div>

          {task.description ? (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">{task.description}</p>
          ) : null}

          {/* 私隱聯絡資訊 */}
          <div className="rounded-lg border p-4">
            {canViewPrivate ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">詳細地址</p>
                  <p className="font-medium">{task.exact_address ?? "—"}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">聯絡人</p>
                    <p className="font-medium">{task.contact_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">電話</p>
                    <p className="font-medium">{task.contact_phone ?? "—"}</p>
                  </div>
                </div>
                {task.contact_phone ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    <a
                      href={`tel:+852${task.contact_phone}`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      <Phone className="size-4" />
                      一鍵撥打
                    </a>
                    <a
                      href={`https://wa.me/852${task.contact_phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp 聯絡
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Lock className="size-6 text-muted-foreground" />
                <p className="font-medium">詳細地址與聯絡方式已隱藏</p>
                <p className="text-sm text-muted-foreground">
                  志工接單後自動解鎖聯絡方式
                </p>
                <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <p>詳細地址：＊＊＊＊＊＊＊＊＊＊＊＊</p>
                  <p>聯絡電話：＊＊＊＊＊＊＊＊</p>
                </div>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <TaskActions
            taskId={task.id}
            status={task.status}
            isCreator={isCreator}
            isVolunteer={isVolunteer}
            canCancel={canCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
