import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { badRequest, notFound, unauthorized } from "@/lib/errors";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/resident/notice
 * Resident submits their move-out / leave notice.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized("Authentication required");

  const body = await readJson(req);
  if (!body.leaveDate) throw badRequest("Move-out date is required");

  const leaveDate = new Date(body.leaveDate);
  if (isNaN(leaveDate.getTime())) throw badRequest("Invalid move-out date");

  // Find resident's active occupancy
  const occupancy = await prisma.occupancy.findFirst({
    where: {
      userId: user.id,
      status: { in: ["ACTIVE", "NOTICE"] },
    },
    include: { unit: true, bed: true, society: true },
  });

  if (!occupancy) throw notFound("No active PG occupancy found for your account");

  const updated = await prisma.occupancy.update({
    where: { id: occupancy.id },
    data: {
      status: "NOTICE",
      leaveDate,
    },
    include: { unit: true, bed: true },
  });

  try {
    await audit({
      societyId: occupancy.societyId,
      userId: user.id,
      action: AUDIT.RESIDENT_UPDATED,
      entityType: "occupancy",
      entityId: occupancy.id,
      oldValue: { status: occupancy.status, leaveDate: occupancy.leaveDate },
      newValue: {
        status: "NOTICE",
        leaveDate,
        reason: body.reason || "Resident requested move-out",
      },
    });
  } catch {
    // Non-blocking audit
  }

  return ok({
    occupancy: updated,
    message: "Move-out notice submitted successfully. Your PG owner has been notified.",
  });
});

/**
 * DELETE /api/resident/notice
 * Resident withdraws their move-out notice.
 */
export const DELETE = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized("Authentication required");

  const occupancy = await prisma.occupancy.findFirst({
    where: {
      userId: user.id,
      status: "NOTICE",
    },
  });

  if (!occupancy) throw notFound("No active notice period found to withdraw");

  const updated = await prisma.occupancy.update({
    where: { id: occupancy.id },
    data: {
      status: "ACTIVE",
      leaveDate: null,
    },
  });

  return ok({
    occupancy: updated,
    message: "Notice withdrawn. Your stay remains active.",
  });
});

