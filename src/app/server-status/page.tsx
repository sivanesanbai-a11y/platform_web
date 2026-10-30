import { redirect } from "next/navigation";

export default function ServerStatus() {
  redirect("/settings");
}
