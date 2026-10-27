import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { getResidentFlatIds, isFlatAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import ResidentsClient from "./ResidentsClient";

export const metadata = { title: "Residents & Check-in" };
export const dynamic = "force-dynamic";

export default async function AdminResidentsPage({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const society = await prisma.society.findUnique({
    where: { id: user.societyId },
    select: { id: true, name: true, type: true },
  });
  const isPg = society?.type !== "SOCIETY"; // Default to PG!

  const flatAdmin = isFlatAdmin(user);
  const managedFlatIds = flatAdmin ? await getResidentFlatIds(user.id) : null;

  const residentWhere = { societyId: user.societyId };
  if (flatAdmin) {
    residentWhere.flatResidents = {
      some: { endDate: null, flatId: { in: managedFlatIds } },
    };
  }

  const flatWhere = { societyId: user.societyId };
  if (flatAdmin) flatWhere.id = { in: managedFlatIds };

  const [occupancies, units, residents, flats, totalSocietyFlats, documents] = await Promise.all([
    prisma.occupancy.findMany({
      where: { societyId: user.societyId },
      include: {
        user: true,
        unit: { include: { building: true } },
        bed: true,
        deposits: {
          select: {
            id: true,
            amountReceived: true,
            status: true,
            refundAmount: true,
            deductionsTotal: true,
          },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          where: { status: { in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] } },
          select: {
            id: true,
            invoiceNumber: true,
            billingPeriod: true,
            totalAmount: true,
            paidAmount: true,
            dueDate: true,
            status: true,
          },
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { joinDate: "desc" }],
    }),
    prisma.unit.findMany({
      where: { societyId: user.societyId },
      include: {
        beds: {
          include: {
            occupancies: { where: { status: { in: ["ACTIVE", "NOTICE"] } } },
          },
          orderBy: { bedLabel: "asc" },
        },
      },
      orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
    }),
    prisma.user.findMany({
      where: residentWhere,
      include: {
        flatResidents: {
          where: { endDate: null },
          include: { flat: { select: { id: true, flatNumber: true, block: true } } },
        },
        occupancies: {
          where: { status: { in: ["ACTIVE", "NOTICE"] } },
          include: { unit: true, bed: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.flat.findMany({
      where: flatWhere,
      select: { id: true, flatNumber: true, block: true },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
    }),
    prisma.flat.count({ where: { societyId: user.societyId } }),
    prisma.tenantDocument.findMany({
      where: { societyId: user.societyId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <ResidentsClient
      isPg={isPg}
      societyName={society?.name || "Bedy PG"}
      userRole={user.role}
      occupancies={occupancies}
      units={units}
      residents={residents}
      flats={flats}
      totalSocietyFlats={totalSocietyFlats}
      initialStatus={resolvedParams.status || "ACTIVE"}
      initialRoom={resolvedParams.room || "ALL"}
      initialDocuments={documents.map((d) => ({
        ...d,
        createdAt: d.createdAt?.toISOString() ?? null,
      }))}
    />
  );
}
