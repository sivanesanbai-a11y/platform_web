import { notFound, redirect } from "next/navigation";
import ModuleWorkspace from "@/components/ModuleWorkspace";

export default async function Page({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (module !== "servicing" && module !== "purchasing") {
    notFound();
  }
  return <ModuleWorkspace kind={module as "servicing" | "purchasing"} />;
}
