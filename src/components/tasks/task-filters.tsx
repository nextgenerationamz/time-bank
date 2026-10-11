import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEFAULT_CATEGORIES, HK_18_DISTRICTS } from "@/constants/hongkong";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TaskFilters({
  district,
  category,
  status,
  enterprise,
}: {
  district: string;
  category: string;
  status: string;
  enterprise: string;
}) {
  const hasFilters = Boolean(district || category || status || enterprise);

  return (
    <form method="get" action="/tasks" className="mt-6 flex flex-wrap items-end gap-3">
      <div className="flex min-w-36 flex-col gap-1">
        <label htmlFor="district" className="text-xs text-muted-foreground">
          分區
        </label>
        <select id="district" name="district" defaultValue={district} className={selectClass}>
          <option value="">全港</option>
          {HK_18_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-36 flex-col gap-1">
        <label htmlFor="category" className="text-xs text-muted-foreground">
          分類
        </label>
        <select id="category" name="category" defaultValue={category} className={selectClass}>
          <option value="">全部分類</option>
          {DEFAULT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-32 flex-col gap-1">
        <label htmlFor="status" className="text-xs text-muted-foreground">
          狀態
        </label>
        <select id="status" name="status" defaultValue={status} className={selectClass}>
          <option value="">全部狀態</option>
          <option value="OPEN">待接單</option>
          <option value="MATCHED">已接單</option>
        </select>
      </div>

      <div className="flex min-w-36 flex-col gap-1">
        <label htmlFor="enterprise" className="text-xs text-muted-foreground">
          任務類型
        </label>
        <select
          id="enterprise"
          name="enterprise"
          defaultValue={enterprise}
          className={selectClass}
        >
          <option value="">全部任務</option>
          <option value="1">企業愛心任務</option>
        </select>
      </div>

      <Button type="submit">篩選</Button>
      {hasFilters ? (
        <Link
          href="/tasks"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          清除篩選
        </Link>
      ) : null}
    </form>
  );
}
