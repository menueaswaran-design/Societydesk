import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { outstandingOn } from "@/lib/billing/penalty";
import PayLandingClient from "./PayLandingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
    include: { society: { select: { name: true } } },
  });
  if (!invoice) return { title: "Pay Rent - Bedy" };
  return {
    title: `Pay Rent: ${invoice.invoiceNumber} - ${invoice.society?.name || "Bedy"}`,
    description: `Quick and secure 1-click rent payment for ${invoice.invoiceNumber}`,
  };
}

export default async function PublicPayPage({ params }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
    include: {
      society: {
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          logoUrl: true,
        },
      },
      occupancy: {
        include: {
          unit: { select: { unitNumber: true, floor: true, ac: true } },
          bed: { select: { bedLabel: true } },
          user: { select: { name: true, phone: true } },
        },
      },
      flat: {
        select: {
          flatNumber: true,
          block: true,
          floor: true,
          residents: {
            where: { endDate: null },
            include: { user: { select: { name: true, phone: true } } },
            orderBy: { isPrimary: "desc" },
            take: 1,
          },
        },
      },
      items: {
        select: { id: true, name: true, type: true, amount: true },
        orderBy: { amount: "desc" },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          transactionReference: true,
          receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } },
        },
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const outstanding = outstandingOn(invoice);

  const residentName =
    invoice.occupancy?.user?.name ||
    invoice.flat?.residents?.[0]?.user?.name ||
    "Resident";
  const residentPhone =
    invoice.occupancy?.user?.phone ||
    invoice.flat?.residents?.[0]?.user?.phone ||
    null;

  const roomLabel = invoice.occupancy
    ? `Room ${invoice.occupancy.unit?.unitNumber || "-"}${
        invoice.occupancy.bed ? ` (Bed ${invoice.occupancy.bed.bedLabel})` : ""
      }`
    : invoice.flat?.block
    ? `${invoice.flat.block}-${invoice.flat.flatNumber}`
    : invoice.flat?.flatNumber || "Unit";

  const serialized = {
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      billingPeriod: invoice.billingPeriod,
      invoiceDate: invoice.invoiceDate?.toISOString() ?? null,
      dueDate: invoice.dueDate?.toISOString() ?? null,
      subtotal: invoice.subtotal,
      previousDue: invoice.previousDue,
      penalty: invoice.penalty,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      outstanding,
      status: invoice.status,
      items: invoice.items,
      payments: invoice.payments.map((p) => ({
        ...p,
        paymentDate: p.paymentDate?.toISOString() ?? null,
      })),
    },
    property: {
      id: invoice.society.id,
      name: invoice.society.name,
      code: invoice.society.code,
      type: invoice.society.type,
      phone: invoice.society.phone,
      email: invoice.society.email,
      address: invoice.society.address,
      city: invoice.society.city,
      logoUrl: invoice.society.logoUrl,
    },
    resident: {
      name: residentName,
      phone: residentPhone,
      unitLabel: roomLabel,
    },
  };

  return <PayLandingClient initialData={serialized} />;
}

