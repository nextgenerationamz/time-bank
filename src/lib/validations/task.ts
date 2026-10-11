import { z } from "zod";

import {
  DEFAULT_CATEGORIES,
  FUNDING_TYPES,
  HK_18_DISTRICTS,
} from "@/constants/hongkong";

/** 表單欄位（不含 fundingType，其由發布方式自動/手動決定） */
export const publishTaskFormSchema = z.object({
  category: z.enum(DEFAULT_CATEGORIES, { message: "請選擇服務分類" }),
  date: z.string().min(1, "請選擇預約日期"),
  startTime: z.string().min(1, "請選擇開始時間"),
  durationMinutes: z
    .number({ invalid_type_error: "請選擇服務時長" })
    .int("服務時長必須為整數分鐘")
    .min(30, "服務時長至少 30 分鐘")
    .max(480, "服務時長最多 8 小時")
    .multipleOf(30, "服務時長須以 0.5 小時為步長"),
  district: z.enum(HK_18_DISTRICTS, { message: "請選擇香港分區" }),
  approxLocation: z
    .string()
    .trim()
    .min(1, "請填寫大致地標")
    .max(200, "請勿超過 200 字"),
  exactAddress: z
    .string()
    .trim()
    .min(1, "請填寫詳細地址")
    .max(300, "請勿超過 300 字"),
  contactName: z.string().trim().min(1, "請填寫聯絡人姓名").max(50, "姓名過長"),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "請填寫 8 位數香港電話號碼"),
});

/** 完整輸入（含發布方式 fundingType） */
export const publishTaskSchema = publishTaskFormSchema.extend({
  fundingType: z.enum(FUNDING_TYPES, { message: "請選擇發布方式" }),
});

export type PublishTaskFormValues = z.infer<typeof publishTaskFormSchema>;
export type PublishTaskInput = z.infer<typeof publishTaskSchema>;
