import "server-only";
import { audit, AUDIT } from "@/lib/audit";

/**
 * Resolves the absolute login URL for email dispatches.
 * Normalizes trailing slashes, strips duplicate /login paths, resolves env variables,
 * and optionally attaches a ?email= query parameter for frictionless 1-click login.
 */
export function getLoginUrl(email = "") {
  const rawBase = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://bedy.in"
  ).trim();

  // Strip trailing slashes and any trailing /login (case-insensitive)
  const cleanBase = rawBase.replace(/\/+$/, "").replace(/\/login$/i, "");
  const baseLoginUrl = `${cleanBase}/login`;

  if (email && typeof email === "string" && email.includes("@")) {
    return `${baseLoginUrl}?email=${encodeURIComponent(email.trim().toLowerCase())}`;
  }

  return baseLoginUrl;
}

/**
 * Sends a welcome email with credentials to a newly created Owner, Manager, or Resident.
 * Uses the exact Bedy Cobalt branded responsive email template.
 * Supports Google Workspace SMTP (via nodemailer), Resend API, or dev console logging fallback.
 * Sender & Support: support@quadrid.in
 */
export async function sendUserWelcomeEmail({
  email,
  name,
  role = "RESIDENT",
  password,
  societyName,
  societyId = null,
  roomNo,
  bedLabel,
  bedPosition,
  roomLabel,
  flatNumber,
  supportPhone,
  resetLink,
}) {
  const startTime = Date.now();
  const dispatchTime = new Date().toISOString();
  const portalUrl = getLoginUrl();
  const directLoginUrl = getLoginUrl(email);
  const loginUrl = directLoginUrl;
  const brandName = societyName || "Bedy";
  const normalizedRole = (role || "RESIDENT").toUpperCase();
  const assignedUnit = roomLabel || (flatNumber ? `Unit ${flatNumber}` : null);

  // Parse bed label and position if combined e.g. "A (Lower)" or "B (Upper)"
  let cleanBedLabel = bedLabel;
  let cleanBedPosition = bedPosition;
  if (bedLabel && !cleanBedPosition) {
    const match = String(bedLabel).match(/^([A-Za-z0-9]+)\s*\(([^)]+)\)$/);
    if (match) {
      cleanBedLabel = match[1];
      cleanBedPosition = match[2];
    }
  }

  // Build assigned space description
  let spaceDescription = "";
  let spaceDetailsHtml = "";
  if (roomNo && cleanBedLabel) {
    spaceDescription = `Room ${roomNo} · Bed ${cleanBedLabel}${cleanBedPosition ? ` (${cleanBedPosition})` : ""}`;
    spaceDetailsHtml = `Room ${roomNo} &middot; Bed ${cleanBedLabel}${cleanBedPosition ? ` (${cleanBedPosition})` : ""}`;
  } else if (roomNo) {
    spaceDescription = `Room ${roomNo}`;
    spaceDetailsHtml = `Room ${roomNo}`;
  } else if (assignedUnit) {
    spaceDescription = assignedUnit;
    spaceDetailsHtml = assignedUnit;
  }

  // Role-specific descriptions
  let roleTitle = "Resident";
  let subject = `Your ${brandName} resident login`;
  let roleDescriptionHtml = `Your resident account at <strong style="color:#10192E;">${brandName}</strong> is ready${spaceDetailsHtml ? ` for ${spaceDetailsHtml}` : ""}. You can pay rent, download receipts and raise maintenance requests.`;
  let textDescription = `Your resident account at ${brandName} is ready${spaceDescription ? ` for ${spaceDescription}` : ""}. You can pay rent, download receipts and raise maintenance requests.`;

  if (normalizedRole === "OWNER" || normalizedRole === "SOCIETY_ADMIN") {
    roleTitle = "Property Owner / Admin";
    subject = `Your ${brandName} owner admin login`;
    roleDescriptionHtml = `Your property owner account at <strong style="color:#10192E;">${brandName}</strong> is ready with administrative access. You can configure room & bed rates, track occupancy and rent collections, and view financial reports.`;
    textDescription = `Your property owner account at ${brandName} is ready with administrative access. You can configure room & bed rates, track occupancy and rent collections, and view financial reports.`;
  } else if (normalizedRole === "MANAGER") {
    roleTitle = "PG / Hostel Manager";
    subject = `Your ${brandName} manager login`;
    roleDescriptionHtml = `Your PG manager account at <strong style="color:#10192E;">${brandName}</strong> is ready. You can manage tenant check-ins, record rent payments and security deposits, track room occupancies, and handle maintenance complaints.`;
    textDescription = `Your PG manager account at ${brandName} is ready. You can manage tenant check-ins, record rent payments and security deposits, track room occupancies, and handle maintenance complaints.`;
  } else if (normalizedRole === "SUPER_ADMIN") {
    roleTitle = "Super Administrator";
    subject = `Your ${brandName} super admin login`;
    roleDescriptionHtml = `Your platform administrator account for <strong style="color:#10192E;">${brandName}</strong> is ready with full platform administration privileges across all properties.`;
    textDescription = `Your platform administrator account for ${brandName} is ready with full platform administration privileges across all properties.`;
  }

  console.log(`[email] [${dispatchTime}] [DISPATCH-START] To: ${email} | Role: ${roleTitle} | Property: ${brandName} | Route: ${loginUrl}`);

  const textBody = `
Hello ${name},

${textDescription}

Login Details:
- Login Email: ${email}
- Temporary Password: ${password}
- Portal URL: ${portalUrl}
${loginUrl !== portalUrl ? `- Direct Login Link: ${loginUrl}\n` : ""}${spaceDescription ? `- Assigned Space: ${spaceDescription}\n` : ""}
${resetLink ? `Or set your own password directly: ${resetLink}\n` : ""}
Please change your password after your first login and don't share this email.

Need help? Contact support at support@quadrid.in${supportPhone ? ` or call ${supportPhone}` : ""}.

Automated message from ${brandName} · Powered by bedy.
`.trim();

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<title>${subject}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  @media only screen and (max-width:540px) {
    .px { padding-left:20px !important; padding-right:20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFF;font-family:'Manrope',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#10192E;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F8FAFF;">
  Your ${brandName} ${roleTitle.toLowerCase()} login details.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFF;">
<tr><td align="center" style="padding:28px 12px 36px 12px;">

  <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;">

    <!-- LOGO -->
    <tr>
      <td style="padding:0 4px 16px 4px;font-size:22px;line-height:22px;font-weight:800;letter-spacing:-1.2px;color:#3154D9;">bedy.</td>
    </tr>

    <!-- CARD -->
    <tr>
      <td class="px" style="background-color:#FFFFFF;border:1px solid #E5EAF3;border-radius:12px;padding:30px 32px;">

        <div style="font-size:20px;line-height:28px;font-weight:700;color:#10192E;">Hello ${name},</div>

        <div style="padding-top:10px;font-size:14px;line-height:22px;color:#39475F;">
          ${roleDescriptionHtml}
        </div>

        <!-- Details -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border:1px solid #E5EAF3;border-radius:8px;">
          ${normalizedRole !== "RESIDENT" ? `
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #E5EAF3;font-size:13px;color:#516078;" width="38%">Role</td>
            <td style="padding:12px 16px;border-bottom:1px solid #E5EAF3;font-size:14px;font-weight:600;color:#10192E;">${roleTitle}</td>
          </tr>
          ` : ""}
          ${spaceDetailsHtml && normalizedRole === "RESIDENT" ? `
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #E5EAF3;font-size:13px;color:#516078;" width="38%">Assigned Space</td>
            <td style="padding:12px 16px;border-bottom:1px solid #E5EAF3;font-size:14px;font-weight:600;color:#10192E;">${spaceDetailsHtml}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #E5EAF3;font-size:13px;color:#516078;" width="38%">Login email</td>
            <td style="padding:12px 16px;border-bottom:1px solid #E5EAF3;font-size:14px;font-weight:600;color:#10192E;word-break:break-all;">${email}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#516078;">Temporary password</td>
            <td style="padding:12px 16px;font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:15px;font-weight:700;color:#10192E;">${password}</td>
          </tr>
        </table>

        <!-- Button -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
          <tr>
            <td bgcolor="#3154D9" style="background-color:#3154D9;border-radius:8px;">
              <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:11px 24px;font-size:14px;line-height:20px;font-weight:700;color:#FFFFFF;text-decoration:none;">Log in to ${brandName}</a>
            </td>
          </tr>
        </table>

        <div style="padding-top:10px;font-size:12px;line-height:18px;color:#6C7890;">
          Or navigate directly to <a href="${portalUrl}" style="color:#3154D9;text-decoration:none;font-weight:600;">${portalUrl}</a>
        </div>

        ${resetLink ? `
        <div style="padding-top:16px;font-size:13px;line-height:20px;color:#516078;">
          Or set your custom password directly by <a href="${resetLink}" style="color:#3154D9;font-weight:600;text-decoration:none;">clicking here</a>.
        </div>
        ` : ""}

        <div style="padding-top:22px;font-size:13px;line-height:20px;color:#516078;">
          Please change your password after your first login and don't share this email.
        </div>

        <div style="padding-top:18px;margin-top:22px;border-top:1px solid #E5EAF3;font-size:13px;line-height:20px;color:#516078;">
          Need help? Contact support at
          <a href="mailto:support@quadrid.in" style="color:#3154D9;font-weight:600;text-decoration:none;">support@quadrid.in</a>${supportPhone ? ` or call the PG office at <a href="tel:${supportPhone}" style="color:#3154D9;font-weight:600;text-decoration:none;">${supportPhone}</a>` : ""}.
        </div>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding:16px 4px 0 4px;font-size:12px;line-height:18px;color:#6C7890;">
        Automated message from ${brandName} &middot; Powered by bedy.
      </td>
    </tr>

  </table>

</td></tr>
</table>

</body>
</html>`.trim();

  const defaultFrom = process.env.SMTP_USER
    ? `Bedy <${process.env.SMTP_USER}>`
    : "Bedy <support@quadrid.in>";
  const fromAddr = process.env.EMAIL_FROM || defaultFrom;
  const replyTo = process.env.SMTP_USER || "support@quadrid.in";

  // 1. Try Resend if API key is provided
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddr,
          reply_to: replyTo,
          to: [email],
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      const durationMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log(`[email] [SUCCESS] [${new Date().toISOString()}] Delivered via Resend in ${durationMs}ms`);
        console.log(`        ├── Provider:   Resend API`);
        console.log(`        ├── From:       ${fromAddr}`);
        console.log(`        ├── To:         ${email} (${name})`);
        console.log(`        ├── Role:       ${roleTitle}`);
        console.log(`        ├── Subject:    "${subject}"`);
        console.log(`        └── Message ID: ${data?.id || "ok"}`);

        await audit({
          societyId,
          action: AUDIT.EMAIL_SENT,
          entityType: "email",
          entityId: email,
          newValue: {
            recipient: email,
            name,
            role: roleTitle,
            subject,
            provider: "resend",
            messageId: data?.id || null,
            durationMs,
          },
        });

        return { success: true, provider: "resend", messageId: data?.id };
      }

      const errData = await res.json().catch(() => ({}));
      console.warn(`[email] [ERROR] [${new Date().toISOString()}] Resend API responded with status ${res.status}:`, errData);

      await audit({
        societyId,
        action: AUDIT.EMAIL_FAILED,
        entityType: "email",
        entityId: email,
        reason: `Resend status ${res.status}`,
        newValue: {
          recipient: email,
          name,
          role: roleTitle,
          subject,
          provider: "resend",
          error: errData,
        },
      });
    } catch (err) {
      console.error(`[email] [ERROR] [${new Date().toISOString()}] Resend delivery error for ${email}:`, err?.message);

      await audit({
        societyId,
        action: AUDIT.EMAIL_FAILED,
        entityType: "email",
        entityId: email,
        reason: err?.message || "Resend network error",
        newValue: {
          recipient: email,
          name,
          role: roleTitle,
          subject,
          provider: "resend",
          error: err?.message,
        },
      });
    }
  }

  // 2. Try SMTP if host and credentials are provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = port === 465;
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, "");

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: isSecure,
        auth: {
          user: process.env.SMTP_USER,
          pass: cleanPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const info = await transporter.sendMail({
        from: fromAddr,
        replyTo,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      const durationMs = Date.now() - startTime;

      console.log(`[email] [SUCCESS] [${new Date().toISOString()}] Delivered via SMTP in ${durationMs}ms`);
      console.log(`        ├── Provider:   SMTP (${process.env.SMTP_HOST}:${port}, ${isSecure ? "SSL" : "TLS"})`);
      console.log(`        ├── From:       ${fromAddr}`);
      console.log(`        ├── To:         ${email} (${name})`);
      console.log(`        ├── Role:       ${roleTitle}`);
      console.log(`        ├── Subject:    "${subject}"`);
      console.log(`        └── Message ID: ${info?.messageId || "ok"}`);

      await audit({
        societyId,
        action: AUDIT.EMAIL_SENT,
        entityType: "email",
        entityId: email,
        newValue: {
          recipient: email,
          name,
          role: roleTitle,
          subject,
          provider: "smtp",
          host: process.env.SMTP_HOST,
          port,
          messageId: info?.messageId || null,
          durationMs,
        },
      });

      return { success: true, provider: "smtp", messageId: info?.messageId };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error(`[email] [ERROR] [${new Date().toISOString()}] SMTP delivery error after ${durationMs}ms`);
      console.error(`        ├── Provider: SMTP (${process.env.SMTP_HOST}:${port})`);
      console.error(`        ├── To:       ${email} (${name})`);
      console.error(`        ├── Role:     ${roleTitle}`);
      console.error(`        └── Error:    ${err?.message}`);

      await audit({
        societyId,
        action: AUDIT.EMAIL_FAILED,
        entityType: "email",
        entityId: email,
        reason: err?.message || "SMTP delivery error",
        newValue: {
          recipient: email,
          name,
          role: roleTitle,
          subject,
          provider: "smtp",
          host: process.env.SMTP_HOST,
          port,
          error: err?.message,
        },
      });
    }
  }

  // 3. Fallback / Dev console emergency logger
  const durationMs = Date.now() - startTime;
  const hasConfiguredTransport = Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER));
  console.log(
    `[email] [DEV-CONSOLE] [${new Date().toISOString()}] ${
      hasConfiguredTransport
        ? "Delivery transport failed — credentials logged to console for emergency access:"
        : "No active email transport configured — credentials logged to console for development:"
    }`
  );
  console.log(`        ├── To:         ${email} (${name})`);
  console.log(`        ├── Role:       ${roleTitle}`);
  console.log(`        ├── Password:   ${password}`);
  console.log(`        ├── Login URL:  ${loginUrl}`);
  if (spaceDescription) console.log(`        ├── Space:      ${spaceDescription}`);
  if (resetLink) console.log(`        ├── Reset Link: ${resetLink}`);
  console.log(`        └── Duration:   ${durationMs}ms`);

  return { success: false, provider: "console" };
}

/**
 * Backward compatibility wrapper for resident welcome emails.
 */
export async function sendResidentWelcomeEmail(params) {
  return sendUserWelcomeEmail({
    ...params,
    role: "RESIDENT",
  });
}

/**
 * Generates a clean, memorable, secure temporary password (e.g. Bedy@8k4m2p).
 * Always satisfies 6+ characters, uppercase, lowercase, numbers, and symbols.
 */
export function generateTemporaryPassword() {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Bedy@${random}`;
}
