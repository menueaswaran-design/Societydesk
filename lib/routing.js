export const ROLE_HOME = {
  SUPER_ADMIN: "/super-admin/dashboard",
  OWNER: "/admin/dashboard",
  MANAGER: "/admin/dashboard",
  SOCIETY_ADMIN: "/admin/dashboard",
  FLAT_ADMIN: "/admin/residents",
  SECURITY_ADMIN: "/admin/complaints",
  RESIDENT: "/resident/dashboard",
};

export function homeForRole(role) {
  return ROLE_HOME[role] ?? "/login";
}
