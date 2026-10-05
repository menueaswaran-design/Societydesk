export const ROLE_HOME = {
  SUPER_ADMIN: "/super-admin/dashboard",
  SOCIETY_ADMIN: "/admin/dashboard",
  RESIDENT: "/resident/dashboard",
};

export function homeForRole(role) {
  return ROLE_HOME[role] ?? "/login";
}