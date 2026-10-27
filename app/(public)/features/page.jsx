import { redirect } from "next/navigation";

export const metadata = {
  title: "Rent Management Features for PGs & Hostels | Bedy",
  description:
    "Explore Bedy features: Live bed occupancy matrix, automated WhatsApp rent reminders with UPI, security deposit settlement, and resident maintenance ticketing.",
  alternates: {
    canonical: "/#features",
  },
};

export default function FeaturesPage() {
  redirect("/#features");
}
