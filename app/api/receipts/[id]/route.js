import { ApiError } from "@/lib/api";
import { fail } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { isStaff, requireFlatAccess, requireOccupancyAccess, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors";
import { receiptDocumentUrl, renderReceiptDocument } from "@/lib/billing/receipt";

export const dynamic = "force-dynamic";

/**
 * GET /api/receipts/:id   (spec section 23)
 *
 * Renders the receipt as a print-ready document; the browser turns it into the
 * PDF the admin or resident downloads.
 * Accessible to authenticated users and public payers with valid receipt links.
 */
export async function GET(req, { params }) {
  try {
    let user = null;
    try {
      user = await getSessionUser(req);
    } catch {
      // Direct receipt link from WhatsApp / public pay
    }

    const { id } = await params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            invoice: {
              include: { items: true },
            },
            occupancy: {
              include: {
                unit: true,
                bed: true,
                user: { select: { name: true } },
              },
            },
            flat: {
              include: {
                residents: {
                  where: { endDate: null },
                  include: { user: { select: { name: true } } },
                  orderBy: { isPrimary: "desc" },
                },
              },
            },
          },
        },
      },
    });
    if (!receipt) throw notFound("Receipt");

    const { payment } = receipt;
    if (!payment) throw notFound("Receipt");

    if (user && !isStaff(user)) {
      resolveSocietyScope(user, receipt.societyId);
      if (payment.flatId) {
        await requireFlatAccess(user, payment.flatId, { societyId: receipt.societyId });
      } else if (payment.occupancyId) {
        await requireOccupancyAccess(user, payment.occupancyId, { societyId: receipt.societyId });
      }
    }

    const society = await prisma.society.findUnique({
      where: { id: receipt.societyId },
      select: { id: true, name: true, address: true, city: true, state: true, pincode: true, phone: true, email: true, logoUrl: true },
    });

    const resident = payment.occupancy?.user ?? payment.flat?.residents?.[0]?.user ?? null;

    const html = renderReceiptDocument({
      society,
      receipt,
      payment,
      invoice: payment.invoice,
      flat: payment.flat,
      occupancy: payment.occupancy,
      resident,
    });

    // Backfill so the UI's receiptUrl link keeps working for older receipts.
    if (!receipt.pdfUrl) {
      prisma.receipt
        .update({ where: { id: receipt.id }, data: { pdfUrl: receiptDocumentUrl(receipt.id) } })
        .catch((err) => console.error("[receipt] failed to persist pdfUrl:", err?.message));
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return fail(err.message, err.status, err.code, err.details);
    }
    console.error("[receipt] unhandled error:", err);
    return fail("Something went wrong on our side", 500, "INTERNAL_ERROR");
  }
}