import { getLoginUrl, sendUserWelcomeEmail } from "@/lib/email";

// Mock audit so database writes are avoided in unit tests
jest.mock("@/lib/audit", () => ({
  audit: jest.fn().mockResolvedValue(true),
  AUDIT: {
    EMAIL_SENT: "EMAIL_SENT",
    EMAIL_FAILED: "EMAIL_FAILED",
  },
}));

describe("Email Login Routing (lib/email)", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    if (originalAppUrl !== undefined) process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    else delete process.env.NEXT_PUBLIC_APP_URL;

    if (originalSiteUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    else delete process.env.NEXT_PUBLIC_SITE_URL;

    if (originalVercelUrl !== undefined) process.env.VERCEL_URL = originalVercelUrl;
    else delete process.env.VERCEL_URL;
  });

  describe("getLoginUrl()", () => {
    test("appends /login when NEXT_PUBLIC_APP_URL has no path", () => {
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      expect(getLoginUrl()).toBe("http://localhost:3000/login");
    });

    test("handles trailing slashes cleanly without double slashes", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://bedy.in/";
      expect(getLoginUrl()).toBe("https://bedy.in/login");
    });

    test("automatically redirects any *.vercel.app domain to https://bedy.in/login to avoid Vercel login wall", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://desk-delta-five.vercel.app/login";
      expect(getLoginUrl()).toBe("https://bedy.in/login");

      process.env.VERCEL_URL = "desk-delta-five.vercel.app";
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getLoginUrl()).toBe("https://bedy.in/login");
    });

    test("prevents duplicate /login paths if already configured with /login", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://bedy.in/login/";
      expect(getLoginUrl()).toBe("https://bedy.in/login");
    });

    test("falls back to https://bedy.in/login when environment variables are unset", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_URL;
      expect(getLoginUrl()).toBe("https://bedy.in/login");
    });

    test("attaches encoded email query parameter for direct login when provided", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://bedy.in";
      const loginUrl = getLoginUrl("suriya+test@gmail.com");
      expect(loginUrl).toBe("https://bedy.in/login?email=suriya%2Btest%40gmail.com");
    });
  });

  describe("sendUserWelcomeEmail() output verification", () => {
    let consoleLogSpy;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    test("routes Owner welcome emails cleanly to /login", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;

      const result = await sendUserWelcomeEmail({
        email: "owner@srilakshmipg.local",
        name: "Suresh Reddy",
        role: "OWNER",
        password: "TempPassword123",
        societyName: "Sri Lakshmi Luxury PG",
      });

      expect(result).toEqual({ success: false, provider: "console" });

      const logCalls = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(logCalls).toContain("http://localhost:3000/login");
      expect(logCalls).toContain("Property Owner / Admin");
    });

    test("routes Manager welcome emails cleanly to https://bedy.in/login", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://bedy.in";
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;

      await sendUserWelcomeEmail({
        email: "manager@srilakshmipg.local",
        name: "Venkatesh Babu",
        role: "MANAGER",
        password: "TempPassword456",
        societyName: "Sri Lakshmi Luxury PG",
      });

      const logCalls = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(logCalls).toContain("https://bedy.in/login");
      expect(logCalls).toContain("PG / Hostel Manager");
    });

    test("routes Resident welcome emails cleanly to https://bedy.in/login with room and bed details", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://bedy.in";
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;

      await sendUserWelcomeEmail({
        email: "resident@srilakshmipg.local",
        name: "Karthik Raja",
        role: "RESIDENT",
        password: "TempPassword789",
        societyName: "Sri Lakshmi Luxury PG",
        roomNo: "101",
        bedLabel: "A (Lower)",
      });

      const logCalls = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(logCalls).toContain("https://bedy.in/login");
      expect(logCalls).toContain("Room 101 · Bed A (Lower)");
    });
  });
});
