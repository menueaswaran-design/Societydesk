export const ROLE_HOME = {
  SUPER_ADMIN: "/super-admin/dashboard",
  SOCIETY_ADMIN: "/admin/dashboard",
  // Security admins work the complaint queue, flat admins manage their flat.
  SECURITY_ADMIN: "/admin/complaints",
  FLAT_ADMIN: "/admin/residents",
  RESIDENT: "/resident/dashboard",
};

export function homeForRole(role) {
  return ROLE_HOME[role] ?? "/login";
}
