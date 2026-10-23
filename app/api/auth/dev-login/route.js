import { cookies } from "next/headers";
import { handler, ok } from "@/lib/api";
import { DEV_COOKIE } from "@/lib/auth/session";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const DEMO_USERS = {
  "bedy@bedy.in": { id: "cmvl59khg0000m7og4a8uysdi", email: "bedy@bedy.in", role: "SUPER_ADMIN", societyId: null, name: "Bedy Super Admin" },
  "bedy@in": { id: "cmvl59khg0000m7og4a8uysdi", email: "bedy@bedy.in", role: "SUPER_ADMIN", societyId: null, name: "Bedy Super Admin" },
  "kumarvignesh865@gmail.com": { id: "cmvckm8mk0000m7gocp8bbb3f", email: "kumarvignesh865@gmail.com", role: "SUPER_ADMIN", societyId: null, name: "Kumar Vignesh" },
  "superadmin@societydesk.local": { id: "demo-super", email: "superadmin@societydesk.local", role: "SUPER_ADMIN", societyId: null, name: "Platform Owner" },
  "admin@greenvalley.local": { id: "demo-admin", email: "admin@greenvalley.local", role: "SOCIETY_ADMIN", societyId: "cmvce8djg0002m7ggemm6z1m7", name: "Lakshmi Iyer" },
  "priya@greenvalley.local": { id: "demo-flat-admin", email: "priya@greenvalley.local", role: "FLAT_ADMIN", societyId: "cmvce8djg0002m7ggemm6z1m7", name: "Priya Sharma" },
  "ravi@greenvalley.local": { id: "demo-resident", email: "ravi@greenvalley.local", role: "RESIDENT", societyId: "cmvce8djg0002m7ggemm6z1m7", name: "Ravi Kumar" },
};

const POSTImpl = handler(async (req) => {
  let email = "";
  try {
    const text = await req.text();
    try { const parsed = JSON.parse(text || "{}"); email = parsed.email || ""; } catch (e) { email = ""; }
  } catch (e) { email = ""; }
  email = String(email).trim().toLowerCase();
  if (!email) throw badRequest("Email is required");

  let user = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, societyId: true, status: true },
    });
    if (dbUser && dbUser.status === "ACTIVE") {
      user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        societyId: dbUser.societyId,
      };
    }
  } catch (e) {
    // Database lookup failed, fall back
  }

  if (!user) {
    user = DEMO_USERS[email];
  }

  if (!user) {
    if (email.includes("admin@greenvalley")) user = DEMO_USERS["admin@greenvalley.local"];
    else if (email.includes("ravi")) user = DEMO_USERS["ravi@greenvalley.local"];
    else if (email.includes("kumarvignesh") || email.includes("superadmin")) user = DEMO_USERS["kumarvignesh865@gmail.com"];
    else user = DEMO_USERS["admin@greenvalley.local"];
  }

  const jar = await cookies();
  jar.delete("__session");

  const proto = req.headers?.get?.("x-forwarded-proto") || "";
  const isHttps = proto === "https" || (typeof req.url === "string" && req.url.startsWith("https://"));

  jar.set(DEV_COOKIE, user.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isHttps,
    maxAge: 60 * 60 * 24 * 7,
  });

  return ok(user);
});

const DELETEImpl = handler(async () => {
  const jar = await cookies();
  jar.delete(DEV_COOKIE);
  jar.delete("__session");
  return ok({ signedOut: true });
});
export async function POST(request, context) { return POSTImpl(request, context); }
export async function DELETE(request, context) { return DELETEImpl(request, context); }
