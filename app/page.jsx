import { redirect } from "next/navigation";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { homeForRole } from "@/lib/routing";

export default async function RootPage() {
  const user = await getServerSessionOrNull();
  redirect(user ? homeForRole(user.role) : "/login");
}