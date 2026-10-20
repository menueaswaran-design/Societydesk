import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope, getResidentFlatIds, isFlatAdmin, isSocietyAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, badRequest, forbidden } from "@/lib/errors";
import { residentUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";

/** A flat admin may only touch residents linked to a flat they manage. Society admins have full society scope. */
async function assertFlatAdminAccess(user, residentId) {
  if (isFlatAdmin(user)) {
    const managedFlatIds = await getResidentFlatIds(user.id);
    const link = await prisma.flatResident.findFirst({
      where: { userId: residentId, endDate: null, flatId: { in: managedFlatIds } },
    });
    if (!link) throw forbidden("You can only manage residents in the flat you manage");
  }
}


/** GET /api/residents/:id */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const resident = await prisma.user.findFirst({
    where: { id, societyId },
    include: {
      flatResidents: {
        include: { flat: { select: { id: true, flatNumber: true, block: true } } },
      },
      paymentsMade: { orderBy: { paymentDate: "desc" }, take: 20 },
    },
  });
  if (!resident) throw notFound("Resident");
  await assertFlatAdminAccess(user, resident.id);

  return ok(resident);
});

/** PATCH /api/residents/:id - update profile / status / flat mapping. */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = residentUpdateSchema.parse(await readJson(req));

  const existing = await prisma.user.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Resident");
  await assertFlatAdminAccess(user, existing.id, societyId);

  // A flat admin cannot move a resident out of the flat they manage.
  if (isFlatAdmin(user) && body.flatId) {
    const managedFlatIds = await getResidentFlatIds(user.id);
    if (!managedFlatIds.includes(body.flatId)) {
      throw forbidden("You can only manage residents in the flat you manage");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.user.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        email: body.email ?? undefined,
        phone: body.phone ?? undefined,
        status: body.status ?? undefined,
      },
    });

    // Update or re-point the resident's flat link
    const current = await tx.flatResident.findFirst({
      where: { userId: id, endDate: null },
    });

    if (body.flatId && (!current || current.flatId !== body.flatId)) {
      const flat = await tx.flat.findFirst({ where: { id: body.flatId, societyId } });
      if (!flat) throw notFound("Flat");

      if (current) {
        await tx.flatResident.update({
          where: { id: current.id },
          data: { endDate: new Date() },
        });
      }

      await tx.flatResident.create({
        data: {
          societyId,
          flatId: flat.id,
          userId: id,
          residentType: body.residentType ?? current?.residentType ?? "TENANT",
          isPrimary: body.isPrimary ?? false,
        },
      });
    } else if (current && (body.residentType !== undefined || body.isPrimary !== undefined)) {
      await tx.flatResident.update({
        where: { id: current.id },
        data: {
          residentType: body.residentType ?? undefined,
          isPrimary: body.isPrimary ?? undefined,
        },
      });
    }

    return row;
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_UPDATED,
    entityType: "user",
    entityId: id,
    oldValue: { name: existing.name, status: existing.status },
    newValue: { name: updated.name, status: updated.status },
  });

  return ok(updated);
});

/** DELETE /api/residents/:id - vacate the flat, never delete billing history. */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  if (id === user.id) throw badRequest("You cannot deactivate your own account");

  const existing = await prisma.user.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Resident");
  await assertFlatAdminAccess(user, existing.id, societyId);

  await prisma.$transaction(async (tx) => {
    await tx.flatResident.updateMany({
      where: { userId: id, endDate: null },
      data: { endDate: new Date() },
    });
    await tx.user.update({ where: { id }, data: { status: "INACTIVE" } });
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_UPDATED,
    entityType: "user",
    entityId: id,
    oldValue: { status: "ACTIVE" },
    newValue: { status: "INACTIVE" },
  });

  return ok({ id, vacated: true });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
