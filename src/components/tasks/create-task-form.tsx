"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HandHeart,
  HeartHandshake,
  Sparkles,
  Wallet,
} from "lucide-react";

import { getPublishContext, publishTask } from "@/app/tasks/create/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_CATEGORIES,
  FUNDING_TYPE_LABELS,
  HK_18_DISTRICTS,
  type FundingType,
} from "@/constants/hongkong";
import {
  determineFundingMode,
  durationToCredits,
  formatCredits,
  type PublishContext,
} from "@/lib/task";
import {
  publishTaskFormSchema,
  type PublishTaskFormValues,
  type PublishTaskInput,
} from "@/lib/validations/task";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "服務分類", description: "選擇所需服務類別" },
  { title: "時間設置", description: "預約日期、時間與預計時長" },
  { title: "地點", description: "分層填寫公開與私隱地點" },
  { title: "聯絡與發布", description: "確認聯絡方式與發布途徑" },
] as const;

const STEP_FIELDS: Record<number, (keyof PublishTaskFormValues)[]> = {
  0: ["category"],
  1: ["date", "startTime", "durationMinutes"],
  2: ["district", "approxLocation", "exactAddress"],
  3: ["contactName", "contactPhone"],
};

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240, 300, 360, 420, 480];

function durationLabel(minutes: number): string {
  return minutes < 60 ? `${minutes} 分鐘` : `${minutes / 60} 小時`;
}

const selectClass = cn(
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

export function CreateTaskForm({ initialContext }: { initialContext: PublishContext }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [context, setContext] = useState<PublishContext>(initialContext);
  const [chosenFundingType, setChosenFundingType] = useState<FundingType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<PublishTaskFormValues>({
    resolver: zodResolver(publishTaskFormSchema),
    mode: "onTouched",
    defaultValues: {
      date: "",
      startTime: "",
      durationMinutes: 60,
      approxLocation: "",
      exactAddress: "",
      contactName: initialContext.displayName ?? "",
      contactPhone: initialContext.phoneNumber ?? "",
    },
  });

  const duration = watch("durationMinutes") ?? 0;
  const cost = durationToCredits(duration);
  const fundingMode = determineFundingMode(
    context.creditBalance,
    context.creditLine,
    cost
  );

  const refreshContext = async () => {
    setError(null);
    const fresh = await getPublishContext();
    setContext(fresh);
    if (!fresh.authenticated) {
      router.push("/login");
    }
  };

  const resolveFundingType = (): FundingType | null => {
    if (fundingMode === "SELF_CREDIT") return "SELF_CREDIT";
    if (fundingMode === "OVERDRAFT") return "OVERDRAFT";
    return chosenFundingType;
  };

  const onSubmit = async (values: PublishTaskFormValues) => {
    const fundingType = resolveFundingType();
    if (!fundingType) {
      setError("請選擇發布方式：申請愛心公池資助或以純愛心義工單發布。");
      return;
    }

    setSubmitting(true);
    setError(null);

    const input: PublishTaskInput = { ...values, fundingType };
    const result = await publishTask(input);

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(result.error);
    }
  };

  const goNext = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) return;

    if (step === STEPS.length - 1) {
      await handleSubmit(onSubmit)();
      return;
    }

    if (step + 1 === STEPS.length - 1) {
      await refreshContext();
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
          <h2 className="text-xl font-semibold">需求發布成功！</h2>
          <p className="text-muted-foreground">
            已將需求發布至任務大廳，社區義工將可瀏覽並接單。
          </p>
          <div className="mt-2 flex gap-3">
            <Button onClick={() => router.push("/tasks")}>前往任務大廳</Button>
            <Button variant="outline" onClick={() => router.push("/tasks/create")}>
              再發布一單
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 步驟指示 */}
      <ol className="flex items-start gap-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  i === step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.title}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 ? (
            <><div className="grid gap-3 sm:grid-cols-2">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <>
                      {DEFAULT_CATEGORIES.map((category) => {
                        const selected = field.value === category;
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => field.onChange(category)}
                            aria-pressed={selected}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                              selected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                : "border-border hover:border-primary/40 hover:bg-muted/50"
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full",
                                selected ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}
                            >
                              <HeartHandshake className="size-4" />
                            </span>
                            <span className="font-medium">{category}</span>
                          </button>
                        );
                      })}
                    </>
                  )}
                />
                {errors.category ? (
                  <p className="text-sm text-destructive sm:col-span-2">
                    {errors.category.message}
                  </p>
                ) : null}
              </div></>
          ) : step === 1 ? (
            <><div className="flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="date">預約日期</Label>
                    <Input id="date" type="date" {...register("date")} />
                    {errors.date ? (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="startTime">開始時間</Label>
                    <Input id="startTime" type="time" {...register("startTime")} />
                    {errors.startTime ? (
                      <p className="text-sm text-destructive">{errors.startTime.message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="durationMinutes">預計服務時長</Label>
                  <Controller
                    name="durationMinutes"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="durationMinutes"
                        className={selectClass}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      >
                        {DURATION_OPTIONS.map((m) => (
                          <option key={m} value={m}>
                            {durationLabel(m)}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.durationMinutes ? (
                    <p className="text-sm text-destructive">
                      {errors.durationMinutes.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">所需時間幣：</span>
                  <span className="font-semibold">{formatCredits(cost)}</span>
                  <span className="text-muted-foreground">（1 小時 = 1.0 TC）</span>
                </div>
              </div></>
          ) : step === 2 ? (
            <><div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="district">香港分區</Label>
                  <select id="district" className={selectClass} {...register("district")}>
                    <option value="">請選擇分區</option>
                    {HK_18_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {errors.district ? (
                    <p className="text-sm text-destructive">{errors.district.message}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="approxLocation">公開地點（大致地標）</Label>
                  <Input
                    id="approxLocation"
                    placeholder="例如：石塘咀街市附近、彩虹邨巴士站旁"
                    {...register("approxLocation")}
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ 全網公開，請勿填寫具體門牌。
                  </p>
                  {errors.approxLocation ? (
                    <p className="text-sm text-destructive">
                      {errors.approxLocation.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="exactAddress">私隱地點（具體屋邨／大廈門牌）</Label>
                  <Input
                    id="exactAddress"
                    placeholder="例如：彩虹邨綠晶樓 1234 室"
                    {...register("exactAddress")}
                  />
                  <p className="text-xs text-muted-foreground">
                    🔒 僅在義工接單後可見。
                  </p>
                  {errors.exactAddress ? (
                    <p className="text-sm text-destructive">
                      {errors.exactAddress.message}
                    </p>
                  ) : null}
                </div>
              </div></>
          ) : (
            <><div className="flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contactName">聯絡人姓名</Label>
                    <Input id="contactName" placeholder="你的姓名" {...register("contactName")} />
                    {errors.contactName ? (
                      <p className="text-sm text-destructive">{errors.contactName.message}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contactPhone">香港電話號碼</Label>
                    <Input
                      id="contactPhone"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="8 位數，例如 98765432"
                      {...register("contactPhone")}
                    />
                    {errors.contactPhone ? (
                      <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-lg bg-muted/60 px-3 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Wallet className="size-4" />
                      可用積分
                    </span>
                    <span className="font-semibold">{formatCredits(context.creditBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">透支額度</span>
                    <span>{formatCredits(context.creditLine)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">本單所需</span>
                    <span className="font-semibold">{formatCredits(cost)}</span>
                  </div>
                </div>

                {fundingMode === "SELF_CREDIT" ? (
                  <div className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
                    <Wallet className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>
                      餘額充足，將以<b>自有信用</b>扣除 {formatCredits(cost)} 發布。
                    </p>
                  </div>
                ) : null}

                {fundingMode === "OVERDRAFT" ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-400/50 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <p>
                      系統已為您啟用<b>長者信用透支額度</b>，無需預先儲值即可發布。
                      （透支後餘額將為 {formatCredits(context.creditBalance - cost)}）
                    </p>
                  </div>
                ) : null}

                {fundingMode === "CHOOSE" ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      所需積分已超過透支額度，請選擇以下其中一種發布方式：
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setChosenFundingType("COMMUNITY_POOL")}
                        aria-pressed={chosenFundingType === "COMMUNITY_POOL"}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                          chosenFundingType === "COMMUNITY_POOL"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <HandHeart className="size-4 text-primary" />
                          申請愛心公池資助
                        </span>
                        <span className="text-xs text-muted-foreground">
                          由社區愛心公池扣減 {formatCredits(cost)}，無需自行支付。
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChosenFundingType("PURE_VOLUNTEER")}
                        aria-pressed={chosenFundingType === "PURE_VOLUNTEER"}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                          chosenFundingType === "PURE_VOLUNTEER"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <HeartHandshake className="size-4 text-primary" />
                          以純愛心義工單發布
                        </span>
                        <span className="text-xs text-muted-foreground">
                          免除積分，邀請義工無償相助。
                        </span>
                      </button>
                    </div>
                    {chosenFundingType ? (
                      <Badge variant="secondary" className="w-fit">
                        {FUNDING_TYPE_LABELS[chosenFundingType]}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div></>
          )}
        </CardContent>
      </Card>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
        >
          <ChevronLeft className="size-4" />
          上一步
        </Button>
        <Button type="button" onClick={goNext} disabled={submitting}>
          {submitting
            ? "發布中…"
            : step === STEPS.length - 1
              ? "確認發布"
              : "下一步"}
          {step !== STEPS.length - 1 ? <ChevronRight className="size-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
