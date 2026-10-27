import { getServerSessionOrNull } from "@/lib/auth/server";
import HomePageClient from "@/components/HomePageClient";

export const metadata = {
  title: "Bedy – PG & Hostel Rent Management Software",
  description:
    "Manage your PG or hostel with Bedy. Track rent payments, pending invoices, resident details, deposits, and complaints in one simple platform.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const user = await getServerSessionOrNull();
  return <HomePageClient user={user} />;
}
