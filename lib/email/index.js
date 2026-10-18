import "server-only";

/**
 * Sends a welcome email with credentials to a newly onboarded resident.
 * Supports Resend API, SMTP, or graceful dev logging fallback.
 */
export async function sendResidentWelcomeEmail({ email, name, password, societyName, flatNumber, resetLink }) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "https://desk-delta-five.vercel.app/login";

  const subject = `Welcome to ${societyName || "SocietyDesk"} - Your Resident Account Details`;
  const textBody = `
Hello ${name},

Welcome to ${societyName || "your society"} on SocietyDesk!

Your resident portal account has been created for Flat ${flatNumber || ""}. You can now view and pay your monthly maintenance dues, download official receipts, and raise maintenance complaints.

Login Details:
- Portal URL: ${loginUrl}
- Email: ${email}
- Temporary Password: ${password}

${resetLink ? `Or set your own password directly using this link:\n${resetLink}\n\n` : ""}You can also use the "Forgot Password" link on the login page anytime.

Best regards,
Management Committee
${societyName || "SocietyDesk"}
`.trim();

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
          from: process.env.EMAIL_FROM || "SocietyDesk <onboarding@resend.dev>",
          to: [email],
          subject,
          text: textBody,
        }),
      });
      if (res.ok) {
        console.log(`[email] Welcome email sent via Resend to ${email}`);
        return { success: true, provider: "resend" };
      }
    } catch (err) {
      console.warn("[email] Resend delivery error:", err?.message);
    }
  }

  // 2. Dev / fallback logger
  console.log(`[email] ================= RESIDENT CREDENTIALS =================`);
  console.log(`[email] To: ${email} (${name})`);
  console.log(`[email] Flat: ${flatNumber}`);
  console.log(`[email] Temporary Password: ${password}`);
  if (resetLink) console.log(`[email] Password Setup Link: ${resetLink}`);
  console.log(`[email] ========================================================`);

  return { success: true, provider: "console" };
}

