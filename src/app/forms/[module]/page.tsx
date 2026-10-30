import { notFound, redirect } from "next/navigation";
import ModuleWorkspace from "@/components/ModuleWorkspace";

export default async function Page({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (module === "purchasing") {
    redirect("/forms/servicing");
  }
  if (module !== "servicing") {
    notFound();
  }
  return <ModuleWorkspace kind="servicing" />;
}
