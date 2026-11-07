import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { getAdminDashboard, getMultiPGSnapshot } from "@/lib/queries/dashboard";
import { getUserAccessibleSocieties } from "@/lib/db/staffAssignments";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const [data, accessibleSocieties] = await Promise.all([
    getAdminDashboard(user.societyId),
    user.role === "OWNER" || user.role === "MANAGER"
      ? getUserAccessibleSocieties(user)
      : Promise.resolve([]),
  ]);

  let multiPGSnapshot = [];
  if (accessibleSocieties && accessibleSocieties.length > 1) {
    multiPGSnapshot = await getMultiPGSnapshot(accessibleSocieties.map((s) => s.id));
  }

  return (
    <AdminDashboardClient
      data={data}
      user={user}
      accessibleSocieties={accessibleSocieties}
      multiPGSnapshot={multiPGSnapshot}
      currentSocietyId={user.societyId}
    />
  );
}
