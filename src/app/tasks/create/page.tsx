import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { getPublishContext } from "./actions";

export const metadata: Metadata = {
  title: "發布需求",
};

export default async function CreateTaskPage() {
  const context = await getPublishContext();

  if (!context.authenticated) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">發布互助需求</h1>
      <p className="mt-2 text-muted-foreground">
        填寫以下資料，讓社區義工更快找到你。
      </p>
      <div className="mt-8">
        <CreateTaskForm initialContext={context} />
      </div>
    </div>
  );
}
