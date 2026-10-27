import Link from "next/link";
import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import ResidentDetailsClient from "./ResidentDetailsClient";

export const metadata = { title: "Resident Details - Bedy" };
export const dynamic = "force-dynamic";

export default async function ResidentDetailsPage({ params }) {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Try finding occupancy by id first, or by userId
  let occupancy = await prisma.occupancy.findFirst({
    where: {
      id,
      societyId: user.societyId,
    },
    include: {
      user: true,
      unit: { include: { building: true } },
      bed: true,
      deposits: {
        include: { deductions: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: { items: true, payments: true },
        orderBy: [{ billingPeriod: "desc" }, { invoiceDate: "desc" }],
      },
      payments: {
        include: {
          invoice: { select: { id: true, invoiceNumber: true, billingPeriod: true } },
          receipts: true,
        },
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!occupancy) {
    // Check if id is a userId
    occupancy = await prisma.occupancy.findFirst({
      where: {
        userId: id,
        societyId: user.societyId,
      },
      orderBy: { joinDate: "desc" },
      include: {
        user: true,
        unit: { include: { building: true } },
        bed: true,
        deposits: {
          include: { deductions: true },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          include: { items: true, payments: true },
          orderBy: [{ billingPeriod: "desc" }, { invoiceDate: "desc" }],
        },
        payments: {
          include: {
            invoice: { select: { id: true, invoiceNumber: true, billingPeriod: true } },
            receipts: true,
          },
          orderBy: { paymentDate: "desc" },
        },
      },
    });
  }

  if (!occupancy) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold ring-1 ring-amber-200">
          !
        </div>
        <h1 className="text-lg font-bold text-slate-900">Resident record not found</h1>
        <p className="text-xs text-slate-500">
          The requested resident or room stay record does not exist or has been removed.
        </p>
        <div>
          <Link
            href="/admin/residents"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            ← Return to Residents & Check-in
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all stays (occupancies) for this same user in this society for stay history & room transfers
  const [allStays, documents, society] = await Promise.all([
    prisma.occupancy.findMany({
      where: {
        userId: occupancy.userId,
        societyId: user.societyId,
      },
      include: {
        unit: { include: { building: true } },
        bed: true,
        deposits: {
          include: { deductions: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { joinDate: "desc" },
    }),
    prisma.tenantDocument.findMany({
      where: {
        userId: occupancy.userId,
        societyId: user.societyId,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.society.findUnique({
      where: { id: user.societyId },
      select: { id: true, name: true, phone: true, address: true },
    }),
  ]);

  return (
    <ResidentDetailsClient
      occupancy={occupancy}
      allStays={allStays}
      documents={documents.map((d) => ({
        ...d,
        createdAt: d.createdAt?.toISOString() ?? null,
      }))}
      society={society}
      userRole={user.role}
    />
  );
}
