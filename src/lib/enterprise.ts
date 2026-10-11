/** 企業資料 */
export type EnterpriseProfile = {
  id: string;
  name: string;
  logo_url: string | null;
  sponsored_pool_credits: number | string;
  total_contributed_hkd: number | string;
};

/** 企業 ESG 統計 */
export type EnterpriseStats = {
  totalServiceHours: number;
  employeeCount: number;
  elderlyBeneficiaries: number;
};

/** 供導出 CSV 的 ESG 服務紀錄列 */
export type EsgLogRow = {
  service_date: string;
  employee_name: string;
  task_title: string;
  service_hours: number;
  impact_score: number;
};

/** 建立 GRI / ESG 社會責任標準 CSV（含 UTF-8 BOM，方便 Excel 開啟） */
export function buildEsgCsv(rows: EsgLogRow[]): string {
  const header = ["服務日期", "員工姓名", "任務", "服務時數", "社會影響分數"];
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

  const lines = rows.map((row) =>
    [
      row.service_date,
      row.employee_name,
      row.task_title,
      row.service_hours.toFixed(2),
      row.impact_score.toFixed(2),
    ]
      .map(escape)
      .join(",")
  );

  return "\uFEFF" + [header.map(escape).join(","), ...lines].join("\r\n");
}
