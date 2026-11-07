import { cookies } from "next/headers";
import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { switchUserActiveSociety } from "@/lib/db/staffAssignments";
import { badRequest } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  const body = await readJson(req);
  const { societyId } = body || {};

  if (!societyId) {
    throw badRequest("Property ID is required to switch");
  }

  const target = await switchUserActiveSociety(user, societyId);

  // Set active society cookie for instant ambient resolution
  const cookieStore = await cookies();
  cookieStore.set("sd_active_society", societyId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return ok({
    success: true,
    society: target,
  });
});
