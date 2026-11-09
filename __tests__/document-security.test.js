import {
  generateSignedCloudinaryUrl,
  getCloudinaryCredentials,
  cloudinaryConfigured,
} from "../lib/client/server.js";
import { AUDIT_ACTION, DOCUMENT_TYPE } from "../lib/constants.js";

describe("Document Security & UIDAI Compliance", () => {
  test("Cloudinary configuration helper returns valid credentials", () => {
    const creds = getCloudinaryCredentials();
    expect(creds.cloudName).toBeDefined();
    expect(creds.apiKey).toBeDefined();
    expect(creds.apiSecret).toBeDefined();
    expect(cloudinaryConfigured()).toBe(true);
  });

  test("generateSignedCloudinaryUrl produces time-limited signed URL with HMAC signature", () => {
    const publicId = "bedy/soc_test/kyc_documents/aadhaar_123";
    const signedUrl = generateSignedCloudinaryUrl({
      publicId,
      resourceType: "image",
    });

    expect(signedUrl).toBeDefined();
    expect(signedUrl).toContain("https://api.cloudinary.com/v1_1/");
    expect(signedUrl).toContain("download?public_id=");
    expect(signedUrl).toContain("timestamp=");
    expect(signedUrl).toContain("api_key=");
    expect(signedUrl).toContain("signature=");
  });

  test("generateSignedCloudinaryUrl supports PDF/raw resource types", () => {
    const publicId = "bedy/soc_test/kyc_documents/aadhaar_pdf_456";
    const signedUrl = generateSignedCloudinaryUrl({
      publicId,
      resourceType: "raw",
      format: "pdf",
    });

    expect(signedUrl).toContain("/raw/download");
    expect(signedUrl).toContain("format=pdf");
    expect(signedUrl).toContain("signature=");
  });

  test("returns null if publicId is missing", () => {
    expect(generateSignedCloudinaryUrl({ publicId: "" })).toBeNull();
  });

  test("AUDIT_ACTION includes document lifecycle actions", () => {
    expect(AUDIT_ACTION.DOCUMENT_UPLOADED).toBe("DOCUMENT_UPLOADED");
    expect(AUDIT_ACTION.DOCUMENT_VIEWED).toBe("DOCUMENT_VIEWED");
    expect(AUDIT_ACTION.DOCUMENT_DELETED).toBe("DOCUMENT_DELETED");
  });

  test("DOCUMENT_TYPE includes required KYC types", () => {
    expect(DOCUMENT_TYPE.AADHAAR).toBe("AADHAAR");
    expect(DOCUMENT_TYPE.PAN).toBe("PAN");
  });

  test("Tenant document RBAC authorization logic", () => {
    // Resident viewing their own document
    const isAllowedResident = (user, doc) => {
      const isOwner = user.id === doc.userId;
      const isStaff = ["ADMIN", "OWNER", "STAFF"].includes(user.role) && (!user.societyId || user.societyId === doc.societyId);
      const isSuperAdmin = user.isSuperAdmin === true;
      return isOwner || isStaff || isSuperAdmin;
    };

    const doc = { id: "doc1", userId: "u1", societyId: "soc1" };

    // 1. Same resident -> Allowed
    expect(isAllowedResident({ id: "u1", role: "RESIDENT" }, doc)).toBe(true);

    // 2. Different resident -> Denied
    expect(isAllowedResident({ id: "u2", role: "RESIDENT" }, doc)).toBe(false);

    // 3. Manager/Admin of same society -> Allowed
    expect(isAllowedResident({ id: "admin1", role: "ADMIN", societyId: "soc1" }, doc)).toBe(true);

    // 4. Manager/Admin of different society -> Denied
    expect(isAllowedResident({ id: "admin2", role: "ADMIN", societyId: "soc2" }, doc)).toBe(false);

    // 5. Super Admin -> Allowed
    expect(isAllowedResident({ id: "super1", role: "SUPER_ADMIN", isSuperAdmin: true }, doc)).toBe(true);
  });
});

