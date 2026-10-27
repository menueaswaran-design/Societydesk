import { redirect } from "next/navigation";

export const metadata = {
  title: "Features — Complete PG & Hostel Management Software",
  description:
    "Explore Bedy features: Live bed occupancy matrix, automated WhatsApp rent reminders with UPI, security deposit settlement, and resident maintenance ticketing.",
};

export default function FeaturesPage() {
  redirect("/#features");
}
