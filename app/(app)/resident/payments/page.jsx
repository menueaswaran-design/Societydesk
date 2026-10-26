import { redirect } from "next/navigation";

export const metadata = { title: "Payment Receipts - Bedy" };
export const dynamic = "force-dynamic";

export default async function ResidentPaymentsPage() {
  redirect("/resident/invoices?filter=PAID");
}
