import { NextResponse } from "next/server";

import { buildEsgCsv, type EsgLogRow } from "@/lib/enterprise";
import { formatScheduledAt } from "@/lib/task";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "not enterprise" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: enterprise } = await admin
    .from("enterprises")
    .select("name")
    .eq("id", profile.company_id)
    .single();

  const { data: logs } = await admin
    .from("esg_service_logs")
    .select("task_id, user_id, service_hours, carbon_or_social_impact_score, created_at")
    .eq("enterprise_id", profile.company_id)
    .order("created_at", { ascending: true });

  const taskIds = [...new Set((logs ?? []).map((l) => l.task_id).filter(Boolean))] as string[];
  const userIds = [...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean))] as string[];

  const { data: tasks } = taskIds.length
    ? await admin.from("tasks").select("id, title").in("id", taskIds)
    : { data: [] };
  const { data: users } = userIds.length
    ? await admin.from("user_profiles").select("id, display_name").in("id", userIds)
    : { data: [] };

  const rows: EsgLogRow[] = (logs ?? []).map((log) => ({
    service_date: formatScheduledAt(log.created_at),
    employee_name: users?.find((u) => u.id === log.user_id)?.display_name ?? "—",
    task_title: tasks?.find((t) => t.id === log.task_id)?.title ?? "—",
    service_hours: Number(log.service_hours ?? 0),
    impact_score: Number(log.carbon_or_social_impact_score ?? 0),
  }));

  const csv = buildEsgCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `ESG_${enterprise?.name ?? "report"}_${date}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
