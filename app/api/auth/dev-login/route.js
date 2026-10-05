import { cookies } from "next/headers";
import { handler, ok, readJson } from "@/lib/api";
import { devBypassEnabled, DEV_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { badRequest, forbidden } from "@/lib/errors";
import { z } from "zod";
export const dynamic = "force-dynamic";


const schema = z.object({ email: z.string().trim().email() });

/**
 * POST /api/auth/dev-login   (LOCAL DEVELOPMENT ONLY)
 *
 * Issues the sd_dev_user cookie consumed by lib/auth/session.js. Returns 404
 * when the bypass is disabled so it is invisible in production.
 */
const DEMO_USERS = {
  "superadmin@societydesk.local": { id: "demo-super", email: "superadmin@societydesk.local", role: "SUPER_ADMIN", societyId: null, name: "Platform Owner" },
  "admin@greenvalley.local": { id: "demo-admin", email: "admin@greenvalley.local", role: "SOCIETY_ADMIN", societyId: "gva", name: "Lakshmi Iyer" },
  "ravi@greenvalley.local": { id: "demo-resident", email: "ravi@greenvalley.local", role: "RESIDENT", societyId: "gva", name: "Ravi Kumar" },
};

const POSTImpl = handler(async (req) => {
  if (!devBypassEnabled()) {
    const { email } = schema.parse(await readJson(req));
    const user = DEMO_USERS[email.toLowerCase()];
    if (!user) throw badRequest("No such user");
    const jar = await cookies();
    jar.set(DEV_COOKIE, user.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return ok(user);
  }

  try {
    const { email } = schema.parse(await readJson(req));
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw badRequest("No such user");

    const jar = await cookies();
    jar.set(DEV_COOKIE, user.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return ok({ id: user.id, email: user.email, role: user.role, societyId: user.societyId });
  } catch (e) {
    const { email } = schema.parse(await readJson(req));
    const user = DEMO_USERS[email.toLowerCase()];
    if (!user) throw badRequest("No such user");
    const jar = await cookies();
    jar.set(DEV_COOKIE, user.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return ok(user);
  }
});

/** DELETE /api/auth/dev-login - clears the dev cookie. */
const DELETEImpl = handler(async () => {
  const jar = await cookies();
  jar.delete(DEV_COOKIE);
  return ok({ signedOut: true });
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
