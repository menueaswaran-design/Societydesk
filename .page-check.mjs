/**
 * Renders the pages touched by the payment work across roles, looking for
 * server-component errors and role/tenant leaks.
 */
const BASE = "http://localhost:3000";
const ROLES = {
  SUPER_ADMIN: "superadmin@societydesk.local",
  SOCIETY_ADMIN: "admin@greenvalley.local",
  RESIDENT: "kumar@greenvalley.local",
  OTHER_TENANT: "admin@sunrise.local",
};

const PAGES = {
  RESIDENT: ["/resident/invoices", "/resident/payments", "/resident/dashboard"],
  SOCIETY_ADMIN: ["/admin/billing/invoices", "/admin/billing/payments", "/admin/dashboard"],
};

let fails = 0;
for (const [role, paths] of Object.entries(PAGES)) {
  const email = ROLES[role];
  console.log(`\n=== ${role} ===`);
  for (const path of paths) {
    const res = await fetch(BASE + path, {
      headers: { Cookie: `sd_dev_user=${email}` },
      redirect: "manual",
    });
    const html = await res.text();
    const crashed =
      res.status >= 500 ||
      /Unhandled Runtime Error|Application error: a server-side exception|Server Components render/i.test(
        html
      );
    // Money must be rendered with the rupee sign, never as a bare number.
    const hasMoney = /\u20b9|&#8377;/.test(html);
    console.log(
      `  [${crashed || !hasMoney ? "FAIL" : "ok  "}] ${path} -> ${res.status}` +
        (crashed ? " (server error)" : "") +
        (!hasMoney ? " (no rupee amounts rendered)" : "")
    );
    if (crashed || !hasMoney) fails++;
    if (role === "RESIDENT" && path === "/resident/invoices") {
      console.log(`         Pay now button present: ${/Pay now/.test(html)}`);
    }
    if (role === "RESIDENT" && path === "/resident/payments") {
      console.log(`         Pending payments panel: ${/Pending payments/.test(html)}`);
    }
    if (role === "SOCIETY_ADMIN" && path === "/admin/billing/payments") {
      console.log(`         Awaiting online payment: ${/Awaiting online payment/.test(html)}`);
    }
    if (role === "SOCIETY_ADMIN" && path === "/admin/billing/invoices") {
      console.log(`         Collect button present: ${/>Collect</.test(html)}`);
    }
  }
}

console.log("\n=== cross-role access is refused ===");
for (const [role, paths] of [
  ["RESIDENT", ["/admin/billing/invoices", "/admin/billing/payments"]],
  ["OTHER_TENANT", ["/resident/invoices", "/resident/payments"]],
]) {
  for (const path of paths) {
    const res = await fetch(BASE + path, {
      headers: { Cookie: `sd_dev_user=${ROLES[role]}` },
      redirect: "manual",
    });
    const html = await res.text();
    // Must be redirected away, never served with the other role's data.
    const leaked = res.status === 200 && /Collect|Awaiting online payment/.test(html);
    console.log(`  [${leaked ? "FAIL" : "ok  "}] ${role} -> ${path} = ${res.status}`);
    if (leaked) fails++;
  }
}

console.log(fails === 0 ? "\nALL PAGE CHECKS PASSED" : `\nFAILURES: ${fails}`);
process.exit(fails === 0 ? 0 : 1);