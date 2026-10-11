import Link from "next/link";
import {
  HandHeart,
  HeartHandshake,
  MapPin,
  Plus,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_CATEGORIES,
  HK_18_DISTRICTS,
  SITE_NAME,
} from "@/constants/hongkong";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <Badge variant="secondary" className="gap-1.5">
          <HeartHandshake className="size-3.5" />
          長者互助 · 以時間換取關懷
        </Badge>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
          {SITE_NAME}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          連繫社區內的長者、家屬與義工。長者發布需求，義工以時間相助，
          每完成一次互助即可累積「時間信用」，讓關懷在社區流轉。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/tasks" className={cn(buttonVariants({ size: "lg" }))}>
            <HeartHandshake className="size-4" />
            瀏覽任務大廳
          </Link>
          <Link
            href="/tasks/create"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            <Plus className="size-4" />
            發布需求
          </Link>
        </div>
      </section>

      {/* 如何運作 */}
      <section className="py-12">
        <h2 className="text-center text-2xl font-semibold">如何運作</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5 text-primary" />
                發布需求
              </CardTitle>
              <CardDescription>
                長者或家屬發布陪診、代購、家居修繕等需求。
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="size-5 text-primary" />
                義工配對
              </CardTitle>
              <CardDescription>
                社區義工按地區與時間伸出援手，完成配對。
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                時間信用入帳
              </CardTitle>
              <CardDescription>
                任務完成後，義工賺取時間信用，長者扣減相應信用。
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* 服務分類 */}
      <section className="py-12">
        <h2 className="text-center text-2xl font-semibold">服務分類</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {DEFAULT_CATEGORIES.map((category) => (
            <Badge key={category} variant="outline" className="px-3 py-1 text-sm">
              {category}
            </Badge>
          ))}
        </div>
      </section>

      {/* 香港 18 區 */}
      <section className="py-12 pb-20">
        <h2 className="flex items-center justify-center gap-2 text-center text-2xl font-semibold">
          <MapPin className="size-6" />
          服務覆蓋香港 18 區
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {HK_18_DISTRICTS.map((district) => (
            <Badge key={district} variant="secondary" className="px-3 py-1 text-sm">
              {district}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
