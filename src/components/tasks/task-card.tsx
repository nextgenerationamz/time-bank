import Link from "next/link";
import { Building2, Clock, MapPin, ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/constants/hongkong";
import {
  formatCredits,
  formatDuration,
  formatScheduledAt,
  type TaskSummary,
} from "@/lib/task";

export function TaskCard({ task }: { task: TaskSummary }) {
  const matched = task.status === "MATCHED";

  return (
    <Link href={`/tasks/${task.id}`} className="group block h-full">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="flex flex-col gap-3">
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

          {task.enterprise_name ? (
            <Badge variant="outline" className="w-fit gap-1 border-primary/40 text-primary">
              <Building2 className="size-3.5" />
              {task.enterprise_name} 贊助認領
            </Badge>
          ) : null}
          {task.has_insurance_coverage ? (
            <Badge variant="secondary" className="w-fit gap-1">
              <ShieldCheck className="size-3.5" />
              已加意外保障
            </Badge>
          ) : null}

          <h3 className="font-semibold leading-snug">{task.title}</h3>

          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>
              {task.district}
              {task.approx_location ? ` · ${task.approx_location}` : ""}
            </span>
          </p>

          <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {task.duration_minutes
                ? formatDuration(Number(task.duration_minutes))
                : "彈性"}
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="size-4" />
              可獲 {formatCredits(Number(task.time_credits_cost))}
            </span>
          </div>

          {task.scheduled_at ? (
            <p className="text-xs text-muted-foreground">
              {formatScheduledAt(task.scheduled_at)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
