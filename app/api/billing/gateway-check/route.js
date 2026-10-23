import { NextResponse } from "next/server";
import { getRazorpayKeys } from "@/lib/billing/gateway";

export const dynamic = "force-dynamic";

export async function GET() {
  const { keyId, keySecret } = getRazorpayKeys();
  const rawKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";
  const gatewayMode = process.env.PAYMENT_GATEWAY_MODE || "auto";

  let testResult = null;
  if (keyId && keySecret) {
    try {
      const auth = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify({
          amount: 100,
          currency: "INR",
          receipt: `diag_${Date.now()}`,
        }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      testResult = {
        httpStatus: res.status,
        success: res.ok,
        orderId: data?.id || null,
        error: res.ok ? null : data?.error || data,
      };
    } catch (e) {
      testResult = {
        httpStatus: 0,
        success: false,
        error: e.message,
      };
    }
  }

  return NextResponse.json({
    status: testResult?.success ? "OK" : "FAILED",
    timestamp: new Date().toISOString(),
    paymentGatewayMode: gatewayMode,
    keyId: {
      configured: Boolean(keyId),
      length: keyId.length,
      prefix: keyId ? `${keyId.slice(0, 8)}...${keyId.slice(-4)}` : "NONE",
      hadQuotesOrSpaces: rawKeyId !== keyId,
    },
    keySecret: {
      configured: Boolean(keySecret),
      length: keySecret.length,
      prefix: keySecret ? `${keySecret.slice(0, 3)}...${keySecret.slice(-3)}` : "NONE",
      hadQuotesOrSpaces: rawKeySecret !== keySecret,
    },
    liveRazorpayTest: testResult,
  });
}
