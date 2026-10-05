import { prisma } from "../db/prisma.js";
import { outstandingOn } from "../billing/penalty.js";
import { getResidentFlatIds } from "../auth/permissions.js";

/**
 * Read-side aggregations shared by the REST API and the Server Component
 * pages, so both surfaces always agree on the numbers.
 */

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const OPEN_COMPLAINT_STATES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"];

/** Admin dashboard (spec section 36). */
export async function getAdminDashboard(societyId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalFlats,
    occupiedFlats,
    totalResidents,
    invoiceAgg,
    overdueAgg,
    paidThisMonth,
    openComplaints,
    urgentComplaints,
    recentPayments,
    recentComplaints,
    recentNotices,
    recentActivity,
    complaintSummary,
  ] = await Promise.all([
    prisma.flat.count({ where: { societyId } }),
    prisma.flat.count({ where: { societyId, status: "OCCUPIED" } }),
    prisma.user.count({ where: { societyId, role: "RESIDENT", status: "ACTIVE" } }),

    prisma.invoice.aggregate({
      where: { societyId, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { societyId, status: "OVERDUE" },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { societyId, paymentDate: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),

    prisma.complaint.count({ where: { societyId, status: { in: OPEN_COMPLAINT_STATES } } }),
    prisma.complaint.count({
      where: { societyId, priority: "URGENT", status: { in: OPEN_COMPLAINT_STATES } },
    }),

    prisma.payment.findMany({
      where: { societyId },
      include: {
        flat: { select: { flatNumber: true, block: true } },
        invoice: { select: { invoiceNumber: true, billingPeriod: true } },
        receipts: { select: { receiptNumber: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 8,
    }),
    prisma.complaint.findMany({
      where: { societyId },
      include: {
        flat: { select: { flatNumber: true, block: true } },
        createdBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.notice.findMany({
      where: { societyId },
      include: { postedBy: { select: { name: true } }, _count: { select: { reads: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      where: { societyId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.complaint.groupBy({
      by: ["status"],
      where: { societyId },
      _count: { _all: true },
    }),
  ]);

  const billed = invoiceAgg._sum.totalAmount ?? 0;
  const collected = invoiceAgg._sum.paidAmount ?? 0;

  return {
    societyId,
    cards: {
      totalFlats,
      occupiedFlats,
      vacantFlats: totalFlats - occupiedFlats,
      totalResidents,
      collectedThisMonth: paidThisMonth._sum.amount ?? 0,
      collectedThisMonthCount: paidThisMonth._count,
      pending: Math.max(0, billed - collected),
      overdue: Math.max(0, (overdueAgg._sum.totalAmount ?? 0) - (overdueAgg._sum.paidAmount ?? 0)),
      overdueInvoiceCount: overdueAgg._count,
      openComplaints,
      urgentComplaints,
    },
    collection: {
      billed,
      collected,
      outstanding: Math.max(0, billed - collected),
      invoiceCount: invoiceAgg._count,
      collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
    },
    complaintSummary: complaintSummary.map((c) => ({ status: c.status, count: c._count._all })),
    recentPayments,
    recentComplaints,
    recentNotices,
    recentActivity,
    generatedAt: now,
  };
}

/** Resident dashboard (spec section 37). */
export async function getResidentDashboard(user) {
  const societyId = user.societyId;
  const flatIds = await getResidentFlatIds(user.id);

  if (flatIds.length === 0) {
    return {
      flats: [],
      currentDue: null,
      totalOutstanding: 0,
      unpaidInvoices: 0,
      activeComplaints: [],
      notices: [],
      unreadNoticeCount: 0,
      recentPayments: [],
      message: "No flat is linked to your account yet. Your society admin needs to add you.",
    };
  }

  const now = new Date();

  const [flats, invoices, activeComplaints, notices, recentPayments, unreadCount] =
    await Promise.all([
      prisma.flat.findMany({
        where: { id: { in: flatIds } },
        select: { id: true, flatNumber: true, block: true, flatType: true, sqFt: true },
      }),
      prisma.invoice.findMany({
        where: { flatId: { in: flatIds }, status: { not: "CANCELLED" } },
        include: { items: true, flat: { select: { flatNumber: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.complaint.findMany({
        where: { flatId: { in: flatIds }, status: { not: "CLOSED" } },
        include: {
          flat: { select: { flatNumber: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.notice.findMany({
        where: { societyId, status: "PUBLISHED" },
        include: { reads: { where: { userId: user.id }, select: { id: true } } },
        orderBy: { publishedAt: "desc" },
        take: 5,
      }),
      prisma.payment.findMany({
        where: { flatId: { in: flatIds } },
        include: {
          invoice: { select: { invoiceNumber: true, billingPeriod: true } },
          receipts: { select: { receiptNumber: true } },
        },
        orderBy: { paymentDate: "desc" },
        take: 6,
      }),
      prisma.notice.count({
        where: { societyId, status: "PUBLISHED", reads: { none: { userId: user.id } } },
      }),
    ]);

  const open = invoices.filter((i) => outstandingOn(i) > 0);
  const currentDue = open[0]
    ? {
        ...open[0],
        outstanding: outstandingOn(open[0]),
        isOverdue: startOfDay(open[0].dueDate) < startOfDay(now),
      }
    : null;

  return {
    flats,
    currentDue,
    totalOutstanding: open.reduce((sum, i) => sum + outstandingOn(i), 0),
    unpaidInvoices: open.length,
    activeComplaints,
    notices: notices.map(({ reads, ...n }) => ({ ...n, readByMe: reads.length > 0 })),
    unreadNoticeCount: unreadCount,
    recentPayments,
  };
}

/** Platform dashboard. Aggregate counts only - never resident money (8.1). */
export async function getPlatformDashboard() {
  const [societies, activeSocieties, roles, tenantRows] = await Promise.all([
    prisma.society.count(),
    prisma.society.count({ where: { status: "ACTIVE" } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.society.findMany({
      include: {
        _count: {
          select: { flats: true, users: true, invoices: true, complaints: true, notices: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    cards: {
      societies,
      activeSocieties,
      inactiveSocieties: societies - activeSocieties,
      usersByRole: roles.reduce((acc, r) => ({ ...acc, [r.role]: r._count._all }), {}),
      flats: tenantRows.reduce((s, t) => s + t._count.flats, 0),
      invoices: tenantRows.reduce((s, t) => s + t._count.invoices, 0),
      complaints: tenantRows.reduce((s, t) => s + t._count.complaints, 0),
    },
    societies: tenantRows,
  };
}