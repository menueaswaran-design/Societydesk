import { cookies } from "next/headers";
import { handler, ok } from "@/lib/api";
import { DEV_COOKIE } from "@/lib/auth/session";
import { badRequest } from "@/lib/errors";
export const dynamic = "force-dynamic";
const DEMO_USERS = {
  "superadmin@societydesk.local": { id: "demo-super", email: "superadmin@societydesk.local", role: "SUPER_ADMIN", societyId: null, name: "Platform Owner" },
  "admin@greenvalley.local": { id: "demo-admin", email: "admin@greenvalley.local", role: "SOCIETY_ADMIN", societyId: "gva", name: "Lakshmi Iyer" },
  "ravi@greenvalley.local": { id: "demo-resident", email: "ravi@greenvalley.local", role: "RESIDENT", societyId: "gva", name: "Ravi Kumar" },
};
const POSTImpl = handler(async (req) => {
  let email = "";
  try {
    const text = await req.text();
    try { const parsed = JSON.parse(text || "{}"); email = parsed.email || ""; } catch (e) { email = ""; }
  } catch (e) { email = ""; }
  email = String(email).trim().toLowerCase();
  if (!email) throw badRequest("Email is required");
  let user = DEMO_USERS[email];
  if (!user) {
    if (email.includes("admin@greenvalley")) user = DEMO_USERS["admin@greenvalley.local"];
    else if (email.includes("ravi")) user = DEMO_USERS["ravi@greenvalley.local"];
    else if (email.includes("superadmin")) user = DEMO_USERS["superadmin@societydesk.local"];
    else user = DEMO_USERS["admin@greenvalley.local"];
  }
  const jar = await cookies();
  jar.set(DEV_COOKIE, user.email, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60*60*24*7 });
  return ok(user);
});
const DELETEImpl = handler(async () => { const jar = await cookies(); jar.delete(DEV_COOKIE); return ok({ signedOut: true }); });
export async function POST(request, context) { return POSTImpl(request, context); }
export async function DELETE(request, context) { return DELETEImpl(request, context); }
