import { redirect } from "next/navigation";

export const metadata = {
  title: "Pricing & Plans | Bedy",
  description:
    "Simple, transparent per-bed and monthly plans for PGs and hostels. 100% digital rent collection with zero hidden commissions.",
  alternates: {
    canonical: "/#pricing",
  },
};

export default function PricingPage() {
  redirect("/#pricing");
}
