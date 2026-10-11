"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { acceptTask, cancelMatch } from "@/app/tasks/[id]/actions";
import { Button } from "@/components/ui/button";

type TaskActionsProps = {
  taskId: string;
  status: string;
  isCreator: boolean;
  isVolunteer: boolean;
  canCancel: boolean;
};

export function TaskActions({
  taskId,
  status,
  isCreator,
  isVolunteer,
  canCancel,
}: TaskActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onAccept = async () => {
    setLoading("accept");
    setError(null);
    const result = await acceptTask(taskId);
    setLoading(null);
    if (!result.success) {
      setError(result.error ?? "接單失敗，請稍後再試。");
      return;
    }
    router.refresh();
  };

  const onCancel = async () => {
    setLoading("cancel");
    setError(null);
    const result = await cancelMatch(taskId);
    setLoading(null);
    if (!result.success) {
      setError(result.error ?? "取消接單失敗，請稍後再試。");
      return;
    }
    router.refresh();
  };

  const errorNode = error ? (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{error}</span>
    </div>
  ) : null;

  if (status === "OPEN" && !isCreator) {
    return (
      <div className="flex flex-col gap-3">
        <Button onClick={onAccept} disabled={loading === "accept"} className="w-full sm:w-auto">
          {loading === "accept" ? "接單中…" : "我要接單"}
        </Button>
        {errorNode}
      </div>
    );
  }

  if (status === "MATCHED" && isVolunteer && canCancel) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading === "cancel"}
          className="w-full sm:w-auto"
        >
          {loading === "cancel" ? "處理中…" : "取消接單"}
        </Button>
        <p className="text-xs text-muted-foreground">
          服務開始前可取消接單，任務將重新開放。
        </p>
        {errorNode}
      </div>
    );
  }

  if (status === "MATCHED" && isVolunteer) {
    return <p className="text-sm text-muted-foreground">你已接單，服務已開始或進行中。</p>;
  }

  if (status === "MATCHED" && isCreator) {
    return <p className="text-sm text-muted-foreground">已有義工接單，請等候聯繫。</p>;
  }

  if (status === "MATCHED") {
    return <p className="text-sm text-muted-foreground">此任務已被接單。</p>;
  }

  if (status === "OPEN" && isCreator) {
    return <p className="text-sm text-muted-foreground">這是你發布的需求，正等待義工接單。</p>;
  }

  return null;
}
