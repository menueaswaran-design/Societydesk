import { AUDIT_ACTION } from "./constants.js";
import { prisma } from "./db/prisma.js";

/**
 * Append-only audit trail (spec section 16).
 * Never throws: a failed audit write must not roll back the business action.
 */
export async function audit({
  societyId = null,
  userId = null,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  reason = null,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        societyId,
        userId,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        reason,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", action, err?.message);
  }
}

export const AUDIT = AUDIT_ACTION;