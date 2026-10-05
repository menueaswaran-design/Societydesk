import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, badRequest } from "@/lib/errors";
import { residentUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/residents/:id */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
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

  return ok(resident);
});

/** PATCH /api/residents/:id - update profile / status / flat mapping. */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = residentUpdateSchema.parse(await readJson(req));

  const existing = await prisma.user.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Resident");

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

    // Re-point the resident at a different flat when flatId changes.
    if (body.flatId) {
      const flat = await tx.flat.findFirst({ where: { id: body.flatId, societyId } });
      if (!flat) throw notFound("Flat");

      const current = await tx.flatResident.findFirst({
        where: { userId: id, endDate: null },
      });

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
          residentType: body.residentType ?? current?.residentType ?? "OWNER",
          isPrimary: body.isPrimary ?? true,
        },
      });
    } else if (body.residentType || body.isPrimary !== undefined) {
      const current = await tx.flatResident.findFirst({
        where: { userId: id, endDate: null },
      });
      if (current) {
        await tx.flatResident.update({
          where: { id: current.id },
          data: {
            residentType: body.residentType ?? undefined,
            isPrimary: body.isPrimary ?? undefined,
          },
        });
      }
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
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  if (id === user.id) throw badRequest("You cannot deactivate your own account");

  const existing = await prisma.user.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Resident");

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
