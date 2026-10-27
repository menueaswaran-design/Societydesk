import { redirect } from "next/navigation";

export const metadata = {
  title: "Pricing — Simple & Transparent PG Management Software",
  description:
    "Affordable per-bed and monthly plans for PGs, hostels, and student co-living properties. 100% digital rent collection with zero hidden charges.",
};

export default function PricingPage() {
  redirect("/#pricing");
}
