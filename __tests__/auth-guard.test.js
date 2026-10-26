import { requirePageRole, requireSocietyContext, ADMIN_ROLES } from "@/lib/auth/guard";
import { redirect } from "next/navigation";

// Mock Next.js navigation so redirect doesn't actually throw an unhandled NEXT_REDIRECT
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Authentication & Role Guards (lib/auth/guard.js)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ADMIN_ROLES constant", () => {
    test("includes OWNER, MANAGER, and SOCIETY_ADMIN", () => {
      expect(ADMIN_ROLES).toContain("OWNER");
      expect(ADMIN_ROLES).toContain("MANAGER");
      expect(ADMIN_ROLES).toContain("SOCIETY_ADMI");
    });
  });

  describe("requirePageRole", () => {
    test("redirects unauthenticated users (null user) to /login", () => {
      requirePageRole(null, ["OWNER"]);
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    test("allows OWNER and MANAGER when SOCIETY_ADMIN is required", () => {
      const ownerUser = { role: "OWNER", societyId: "soc_123" };
      const managerUser = { role: "MANAGER", societyId: "soc_123" };

      requirePageRole(ownerUser, ["SOCIETY_ADMIN"]);
      requirePageRole(managerUser, ["SOCIETY_ADMIN"]);

      expect(redirect).not.toHaveBeenCalled();
    });

    test("redirects unauthorized roles (e.g. RESIDENT accessing admin page) to their role home", () => {
      const residentUser = { role: "RESIDENT", societyId: "soc_123" };

      requirePageRole(residentUser, ["OWNER", "MANAGER"]);

      expect(redirect).toHaveBeenCalledWith("/resident/dashboard");
    });
  });

  describe("requireSocietyContext", () => {
    test("returns societyId when user has valid admin role and societyId", () => {
      const user = { role: "OWNER", societyId: "soc_abc" };
      const societyId = requireSocietyContext(user);

      expect(societyId).toBe("soc_abc");
      expect(redirect).not.toHaveBeenCalled();
    });

    test("redirects if user has no societyId assigned", () => {
      const userWithoutSociety = { role: "OWNER", societyId: null };

      requireSocietyContext(userWithoutSociety);
      expect(redirect).toHaveBeenCalledWith("/admin/dashboard");
    });
  });
});

