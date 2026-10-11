import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TaskCard } from "@/components/tasks/task-card";
import { TaskFilters } from "@/components/tasks/task-filters";
import type { TaskSummary } from "@/lib/task";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "任務大廳",
};

type SearchParams = Promise<{
  district?: string;
  category?: string;
  status?: string;
  enterprise?: string;
}>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const district = params.district ?? "";
  const category = params.category ?? "";
  const status = params.status ?? "";
  const enterprise = params.enterprise ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("tasks_public")
    .select("*")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (district) query = query.eq("district", district);
  if (category) query = query.eq("category", category);
  if (status === "OPEN" || status === "MATCHED") query = query.eq("status", status);
  if (enterprise === "1") query = query.not("enterprise_tag_id", "is", null);

  const { data, error } = await query;
  const tasks = (data ?? []) as TaskSummary[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">任務大廳</h1>
      <p className="mt-2 text-muted-foreground">
        瀏覽社區互助任務，伸出援手，累積時間信用。
      </p>

      <TaskFilters
        district={district}
        category={category}
        status={status}
        enterprise={enterprise}
      />

      {error ? (
        <p className="mt-6 text-sm text-destructive">載入任務失敗，請稍後再試。</p>
      ) : tasks.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          目前沒有符合條件的任務。
        </div>
      )}
    </div>
  );
}

