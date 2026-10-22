/**
 * WhatsApp Rent Collection & Receipt Messenger Utilities
 *
 * Provides phone number sanitization, NPCI-standard UPI deep links,
 * and high-converting personalized WhatsApp messages for:
 * 1. 1-Click Rent Reminders (Due soon)
 * 2. Defaulter / Overdue Notices
 * 3. Instant Payment Confirmation & Official PDF Receipts
 */

/**
 * Sanitize an Indian or international phone number for WhatsApp links.
 * Strips formatting, ensures country code 91 for standard 10-digit Indian numbers.
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";

  // 10 digits (standard Indian mobile): prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  // 11 digits starting with 0 (e.g. 09876543210): convert 0 to 91
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }
  // Already has country code
  return digits;
}

/**
 * Format currency into Indian Rupees format (e.g. ₹14,000)
 */
function formatRupees(amount) {
  const num = Math.round(Number(amount) || 0);
  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Generate a standard WhatsApp web/app link.
 */
export function getWhatsAppUrl(phone, text) {
  const cleaned = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(text.trim());
  if (cleaned) {
    return `https://wa.me/${cleaned}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

/**
 * Generate an NPCI-compliant UPI deep-link for instant mobile payments
 * Opens Google Pay, PhonePe, Paytm, BHIM, Cred, etc. on mobile.
 */
export function buildUpiDeepLink({ upiId = "pgowner@okaxis", payeeName = "PG Manager", amount, invoiceNumber }) {
  const cleanUpi = (upiId || "pgowner@okaxis").trim();
  const cleanName = (payeeName || "Property Manager").trim();
  const am = Math.round(Number(amount) || 0);
  const note = (invoiceNumber || "Rent").slice(0, 30);

  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}&am=${am}&cu=INR&tn=${encodeURIComponent(note)}`;
}

/**
 * Pre-filled 1-Click Rent Reminder message for WhatsApp
 */
export function buildRentReminderMessage({
  residentName = "Resident",
  roomLabel = "Room",
  period = "this month",
  amount = 0,
  dueDate = "5th",
  payUrl = "",
  pgName = "Bedy PG",
}) {
  const name = residentName?.trim() || "Resident";
  const room = roomLabel?.trim() || "Room";
  const money = formatRupees(amount);

  return `Hi ${name}, your ${room} rent for ${period} (${money}) is due by ${dueDate}.

Tap to pay via UPI / Cards / QR:
👉 ${payUrl}

Thank you!
— ${pgName}`;
}

/**
 * Pre-filled Defaulter / Overdue notice for WhatsApp
 */
export function buildDefaulterNoticeMessage({
  residentName = "Resident",
  roomLabel = "Room",
  daysOverdue = 1,
  amount = 0,
  payUrl = "",
  pgName = "Bedy PG",
}) {
  const name = residentName?.trim() || "Resident";
  const room = roomLabel?.trim() || "Room";
  const money = formatRupees(amount);

  return `⚠️ Payment Reminder from ${pgName}

Hi ${name}, your rent for ${room} (${money}) is overdue by ${daysOverdue} days.

Please clear the outstanding dues today via instant UPI / 1-Click Pay:
👉 ${payUrl}

If you have already paid, please share the transaction reference. Thank you!`;
}

/**
 * Pre-filled Payment Confirmation & PDF Receipt delivery message
 */
export function buildReceiptWhatsAppMessage({
  residentName = "Resident",
  roomLabel = "Room",
  amount = 0,
  receiptNumber = "",
  receiptUrl = "",
  pgName = "Bedy PG",
}) {
  const name = residentName?.trim() || "Resident";
  const room = roomLabel?.trim() || "Room";
  const money = formatRupees(amount);
  const rcpt = receiptNumber ? `Receipt #${receiptNumber}` : "Payment Receipt";

  return `✅ Payment Successful - ${pgName}

Hi ${name}, thank you! Your rent payment of ${money} for ${room} has been received successfully.

Official ${rcpt}
View / Download PDF:
👉 ${receiptUrl}

Thank you for paying on time!`;
}

