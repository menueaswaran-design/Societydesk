import { getServerSessionOrNull } from "@/lib/auth/server";
import HomePageClient from "@/components/HomePageClient";

export const metadata = {
  title: "Bedy — Smart PG, Hostel & Co-Living Operations",
  description:
    "Modern web platform for PG and hostel owners: live bed occupancy, 1-click WhatsApp rent collection, instant UPI, deposit settlements, and complaint tracking.",
};

export default async function HomePage() {
  const user = await getServerSessionOrNull();
  return <HomePageClient user={user} />;
}