/**
 * Meta WhatsApp Cloud API Service & Automated Notifications
 *
 * Supports:
 * - Direct official Meta Graph API v21.0 integration
 * - Automated invoice dispatch with toggle (META_WHATSAPP_AUTO_DISPATCH / society setting)
 * - Template-based and dynamic text fallbacks
 * - Delivery status tracking and error handling
 */

import { prisma } from "@/lib/db/prisma";
import { cleanPhoneNumber, buildRentReminderMessage, buildPaymentReceiptMessage } from "./whatsapp";

const META_GRAPH_VERSION = "v21.0";
const META_API_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Check if automated Meta WhatsApp notifications are enabled globally or for a specific society.
 */
export async function isMetaWhatsAppEnabled(societyId = null) {
  // Global environment toggle
  const globalEnabled = process.env.META_WHATSAPP_ENABLED === "true";
  const hasCredentials = Boolean(
    process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID
  );

  if (!hasCredentials) {
    return { enabled: false, reason: "Missing Meta WhatsApp API credentials in environment" };
  }

  // If society-specific toggle is checked in DB
  if (societyId) {
    try {
      const society = await prisma.society.findUnique({
        where: { id: societyId },
        select: { id: true, name: true },
      });
      // In production, can check society.autoWhatsAppEnabled column or default to global
      return { enabled: globalEnabled, societyName: society?.name };
    } catch {
      return { enabled: globalEnabled };
    }
  }

  return { enabled: globalEnabled };
}

/**
 * Send an official Meta WhatsApp Cloud API message.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient phone number (e.g. "9876543210" or "919876543210")
 * @param {string} [options.text] - Plain text message (used for session messages)
 * @param {Object} [options.template] - Meta approved template payload
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendMetaWhatsAppMessage({ to, text, template }) {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("[meta-whatsapp] Missing META_WHATSAPP_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID");
    return { success: false, error: "Meta WhatsApp credentials not configured" };
  }

  const recipient = cleanPhoneNumber(to);
  if (!recipient) {
    return { success: false, error: "Invalid recipient phone number" };
  }

  const endpoint = `${META_API_URL}/${phoneNumberId}/messages`;

  let payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
  };

  if (template) {
    payload.type = "template";
    payload.template = template;
  } else if (text) {
    payload.type = "text";
    payload.text = { preview_url: true, body: text };
  } else {
    return { success: false, error: "Either text or template is required" };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[meta-whatsapp] API error:", data?.error || data);
      return {
        success: false,
        error: data?.error?.message || "Failed to deliver WhatsApp message via Meta API",
        details: data?.error,
      };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    console.error("[meta-whatsapp] Network exception:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch an Automated Rent Invoice notification via Meta WhatsApp Cloud API.
 * Automatically respects the ON/OFF setting.
 */
export async function autoSendInvoiceWhatsApp({
  invoice,
  residentPhone,
  residentName,
  roomLabel,
  pgName,
  payUrl,
  force = false,
}) {
  const { enabled, reason } = await isMetaWhatsAppEnabled(invoice?.societyId);

  // If automated dispatch is OFF and not forced manually, skip gracefully
  if (!enabled && !force) {
    return {
      sent: false,
      reason: reason || "Automated WhatsApp notifications are currently turned OFF in settings.",
    };
  }

  if (!residentPhone) {
    return { sent: false, reason: "No phone number available for resident." };
  }

  const templateName = process.env.META_WHATSAPP_INVOICE_TEMPLATE;

  // Option A: If Meta approved template is configured in .env
  if (templateName) {
    const templatePayload = {
      name: templateName,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: residentName || "Resident" },
            { type: "text", text: roomLabel || "Room" },
            { type: "text", text: `₹${invoice.totalAmount?.toLocaleString("en-IN")}` },
            { type: "text", text: invoice.billingPeriod || "this month" },
            { type: "text", text: pgName || "Bedy PG" },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: invoice.id,
            },
          ],
        },
      ],
    };

    const res = await sendMetaWhatsAppMessage({
      to: residentPhone,
      template: templatePayload,
    });
    return { sent: res.success, messageId: res.messageId, error: res.error };
  }

  // Option B: Fallback to high-converting interactive text message
  const textMessage = buildRentReminderMessage({
    residentName,
    roomLabel,
    period: invoice.billingPeriod,
    amount: invoice.totalAmount,
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "5th",
    payUrl: payUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://bedy.in"}/pay/${invoice.id}`,
    pgName: pgName || "Bedy PG",
  });

  const res = await sendMetaWhatsAppMessage({
    to: residentPhone,
    text: textMessage,
  });

  return { sent: res.success, messageId: res.messageId, error: res.error };
}

