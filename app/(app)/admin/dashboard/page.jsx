import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { getAdminDashboard } from "@/lib/queries/dashboard";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const data = await getAdminDashboard(user.societyId);

  return <AdminDashboardClient data={data} user={user} />;
}
