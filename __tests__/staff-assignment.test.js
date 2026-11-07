import { staffCreateSchema, societyCreateSchema } from "@/lib/validation/schemas";
import {
  switchUserActiveSociety,
  addSocietyAssignment,
  getUserAccessibleSocieties,
  getPGManagersForSocieties,
} from "@/lib/db/staffAssignments";
import { getMultiPGSnapshot } from "@/lib/queries/dashboard";
import { prisma } from "@/lib/db/prisma";

// Mock prisma for db unit tests
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    society: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: "user-123" }),
    },
    bed: { count: jest.fn().mockResolvedValue(15) },
    occupancy: { count: jest.fn().mockResolvedValue(12) },
    invoice: { aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 25000, paidAmount: 15000 }, _count: 3 }) },
    complaint: { count: jest.fn().mockResolvedValue(1) },
  },
}));

describe("Staff & Multi-PG Assignments", () => {
  describe("staffCreateSchema validation", () => {
    test("validates valid PG manager with multiple societyIds", () => {
      const data = {
        name: "Ramesh Manager",
        email: "ramesh@bedy.in",
        phone: "9876543210",
        role: "MANAGER",
        societyIds: ["soc-1", "soc-2", "soc-3"],
      };

      const parsed = staffCreateSchema.parse(data);
      expect(parsed.name).toBe("Ramesh Manager");
      expect(parsed.email).toBe("ramesh@bedy.in");
      expect(parsed.societyIds).toEqual(["soc-1", "soc-2", "soc-3"]);
    });

    test("validates valid PG manager with single societyId", () => {
      const data = {
        name: "Suresh Staff",
        email: "suresh@bedy.in",
        role: "MANAGER",
        societyId: "soc-1",
      };

      const parsed = staffCreateSchema.parse(data);
      expect(parsed.email).toBe("suresh@bedy.in");
      expect(parsed.societyId).toBe("soc-1");
    });

    test("rejects invalid email", () => {
      expect(() => {
        staffCreateSchema.parse({
          name: "Invalid",
          email: "not-an-email",
          role: "MANAGER",
        });
      }).toThrow();
    });
  });

  describe("switchUserActiveSociety", () => {
    test("throws if user or targetSocietyId is missing", async () => {
      await expect(switchUserActiveSociety(null, "soc-1")).rejects.toThrow(
        "User and target society ID are required"
      );
      await expect(switchUserActiveSociety({ id: "u1" }, null)).rejects.toThrow(
        "User and target society ID are required"
      );
    });

    test("throws if target society is not accessible to non-superadmin", async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { id: "soc-1", name: "PG 1", code: "P1", type: "PG_HOSTEL", logoUrl: null, role: "MANAGER" },
      ]);

      const manager = { id: "mgr-1", role: "MANAGER", societyId: "soc-1" };

      await expect(switchUserActiveSociety(manager, "soc-unauthorized")).rejects.toThrow(
        "You do not have access to this property"
      );
    });

    test("updates active societyId when target is accessible", async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { id: "soc-1", name: "PG 1", code: "P1", type: "PG_HOSTEL", logoUrl: null, role: "MANAGER" },
        { id: "soc-2", name: "PG 2", code: "P2", type: "PG_HOSTEL", logoUrl: null, role: "MANAGER" },
      ]);

      const manager = { id: "mgr-1", role: "MANAGER", societyId: "soc-1" };

      const result = await switchUserActiveSociety(manager, "soc-2");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "mgr-1" },
        data: { societyId: "soc-2" },
      });
      expect(result.id).toBe("soc-2");
    });
  });

  describe("addSocietyAssignment & Owner PG Creation", () => {
    test("validates PG property creation without admin credentials (owner flow)", () => {
      const data = {
        name: "Suriya Luxury PG",
        code: "SLPG",
        phone: "9876543210",
        address: "123 Tech Park Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560100",
        managerIds: ["mgr-1", "mgr-2"],
        setAsActive: true,
      };

      const parsed = societyCreateSchema.parse(data);
      expect(parsed.name).toBe("Suriya Luxury PG");
      expect(parsed.code).toBe("SLPG");
      expect(parsed.managerIds).toEqual(["mgr-1", "mgr-2"]);
      expect(parsed.setAsActive).toBe(true);
      expect(parsed.adminName).toBeUndefined();
    });

    test("addSocietyAssignment inserts without removing other assignments", async () => {
      await addSocietyAssignment("owner-1", "soc-new", "OWNER");
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO \"StaffAssignment\""),
        "assign_owner-1_soc-new",
        "owner-1",
        "soc-new",
        "OWNER"
      );
    });
  });

  describe("Owner Tree Multi-Tenant Isolation", () => {
    test("owner ONLY receives properties assigned to their user ID (isolated from other owners)", async () => {
      const ownerA = { id: "owner-A", role: "OWNER", societyId: "soc-A1", email: "ownera@bedy.in" };

      // prisma.$queryRawUnsafe returns only owner A's properties
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { id: "soc-A1", name: "Owner A PG 1", code: "APG1", type: "PG", logoUrl: null, role: "OWNER" },
        { id: "soc-A2", name: "Owner A PG 2", code: "APG2", type: "PG", logoUrl: null, role: "OWNER" },
      ]);
      prisma.society.findMany.mockResolvedValueOnce([]);

      const societies = await getUserAccessibleSocieties(ownerA);
      const societyIds = societies.map((s) => s.id);

      expect(societyIds).toEqual(["soc-A1", "soc-A2"]);
      expect(societyIds).not.toContain("soc-B1");
    });

    test("owner cannot switch active context to another owner's property", async () => {
      const ownerA = { id: "owner-A", role: "OWNER", societyId: "soc-A1", email: "ownera@bedy.in" };

      // Return only owner A's societies
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { id: "soc-A1", name: "Owner A PG 1", code: "APG1", type: "PG", logoUrl: null, role: "OWNER" },
      ]);

      await expect(switchUserActiveSociety(ownerA, "soc-B1")).rejects.toThrow(
        "You do not have access to this property"
      );
    });

    test("getPGManagersForSocieties isolates manager assignments strictly to the owner's society IDs", async () => {
      const ownerASocietyIds = ["soc-A1", "soc-A2"];

      // Mock assignments query for owner A's societies
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { userId: "mgr-1", societyId: "soc-A1", societyName: "Owner A PG 1", societyCode: "APG1" },
      ]);

      prisma.user.findMany.mockResolvedValueOnce([
        {
          id: "mgr-1",
          name: "Manager 1",
          email: "m1@bedy.in",
          phone: "9000000001",
          role: "MANAGER",
          status: "ACTIVE",
          societyId: "soc-A1",
          society: { id: "soc-A1", name: "Owner A PG 1", code: "APG1" },
        },
      ]);

      const managers = await getPGManagersForSocieties(ownerASocietyIds);
      expect(managers.length).toBe(1);
      expect(managers[0].assignedSocieties.every((s) => ownerASocietyIds.includes(s.id))).toBe(true);
    });

    test("getMultiPGSnapshot returns multi-PG overview with accurate stats per PG", async () => {
      prisma.society.findMany.mockResolvedValueOnce([
        {
          id: "pg-1",
          name: "Vishvas womens pg",
          code: "VWPG",
          type: "PG",
          city: "Bengaluru",
          _count: { units: 5, beds: 20 },
        },
        {
          id: "pg-2",
          name: "suriya pg",
          code: "SPG",
          type: "PG",
          city: "Bengaluru",
          _count: { units: 4, beds: 15 },
        },
      ]);

      const snapshots = await getMultiPGSnapshot(["pg-1", "pg-2"]);
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].name).toBe("Vishvas womens pg");
      expect(snapshots[0].totalBeds).toBe(20);
      expect(snapshots[0].occupiedBeds).toBe(15);
      expect(snapshots[0].pendingAmount).toBe(10000);
      expect(snapshots[1].name).toBe("suriya pg");
    });
  });
});
